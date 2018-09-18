const defaultOptions = {
  hash: 'lang',
  tableName: 'i18n',
  range: 'namespace',
  documentClient: null,
  translationsKey: 'data'
};

class Backend {
  constructor(services, options = {}) {
    this.init(services, options);
    this.type = 'backend';
  }

  init(services, options, coreOptions){
    this.services = services;
    this.options = { ...defaultOptions, ...this.options, ...options };
    this.coreOptions = coreOptions;
  }

  read(language, namespace, callback) {
    const { documentClient, hash, range, tableName, translationsKey } = this.options;
    if (!documentClient) {
      return callback(null, null);
    }

    const getDocumentQuery = {
      TableName: tableName,
      Key: {
        [hash]: language,
        [range]: namespace
      },
      AttributesToGet: [ translationsKey ]
    };

    const getItemPromise = documentClient.get(getDocumentQuery).promise();
    getItemPromise()
      .catch(callback)
      .then((data) => callback(null, data.Item[translationsKey]))
  }

  _readMultiQueryBuilder(languages, namespaces ) {
    const { hash, range } = this.options;
    const namespaceQuery = namespaces.map((ns, index) => `(${range} = :namespace${index})`).join(' or ');
    const languagesQuery = languages.map((lang, index) => `(${hash} = :lang${index} and (${namespaceQuery})`).join(' or ');
    return languagesQuery;
  }

  _readMultiExpressionAttributeValuesMapper(languages, namespaces) {
    const expressionAttributeValues = {};
    languages.forEach((lang, index) => { expressionAttributeValues[`:lang${index}`] = lang; });
    namespaces.forEach((ns, index) => { expressionAttributeValues[`:namespace${index}`] = ns; });
    return expressionAttributeValues;
  }

  readMulti(languages, namespaces, callback) {
    const {
      range,
      tableName,
      documentClient,
      query : KeyConditionExpression = this._readMultiQueryBuilder(languages, namespaces),
    } = this.options;
    if (!documentClient) {
      return callback(null, null);
    }

    const ExpressionAttributeValues =  this._readMultiExpressionAttributeValuesMapper(languages, namespaces);

    const getDocumentsQuery = {
      TableName: tableName,
      ScanIndexForward: true,
      KeyConditionExpression,
      ExpressionAttributeValues,
      Select: 'ALL',
    };
    const documentsQuery = documentClient.query(getDocumentsQuery).promise();
    documentsQuery()
      .catch(callback)
      .then((data) => {
        const response = {};
        data.Items.forEach((item) => {
          response[item.language] = {  [range]: {} };
          response[item.language][range] = item.translations;
        });
        callback(null, response);
      })
  }
}

Backend.type = 'backend';

export default Backend;
