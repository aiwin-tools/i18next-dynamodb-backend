const getDefaults = () => ({
  hash: 'lang',
  tableName: 'i18n',
  range: 'namespace',
  documentClient: null,
  translationsKey: 'data'
});

/**
 * @class
 * I18next backend plugin
 */
class I18NextDynamoDbBackend {
  /**
   * Create a i18next dynamodb plugin instance.
   * @constructor
   * @param {Object} services
   * @param {{documentClient: object, hash: string, range: string, tableName: string, translationsKey: string}} options
   */
  constructor(services, options = {}, allOptions = {}) {
    this.init(services, options, allOptions);
    this.type = 'backend';
  }

  /**
   * Initialize DynamoDB plugin
   * @param services {Object}
   * @param options {{documentClient: object, hash: string, range: string, tableName: string, translationsKey: string}}
   * @param coreOptions {Object}
   */
  init(services, options, coreOptions) {
    this.services = services;
    this.options = { ...getDefaults(), ...this.options, ...options };
    this.coreOptions = coreOptions;
  }

  /**
   *
   * @param language {String}
   * @param namespace {String}
   * @param callback {Function}
   */
  read(language, namespace, callback) {
    const { documentClient, hash, range, tableName, translationsKey } = this.options;
    if (!documentClient) {
      callback(null, null);
    } else {
      const getDocumentQuery = {
        TableName: tableName,
        Key: {
          [hash]: language,
          [range]: namespace
        },
        AttributesToGet: [translationsKey]
      };
      const getItemPromise = documentClient.get(getDocumentQuery).promise();
      getItemPromise
        .catch(callback)
        .then(data => callback(null, data.Item && data.Item[translationsKey]));
    }

  }

  /**
   * Given some languages and/or some namespaces returns a Dynamodb query
   * @private
   * @param languages {Array}
   * @param namespaces {Array}
   * @returns {String}
   */
  _readMultiQueryBuilder(languages, namespaces) {
    const { hash, range } = this.options;
    const namespaceQuery = namespaces.map((ns, index) => `(${range} = :namespace${index})`).join(' or ');
    return languages.map((lang, index) => `(${hash} = :lang${index} and (${namespaceQuery})`).join(' or ');
  }

  /**
   * Given some languages and/or some namespaces returns a Dynamodb query attributeValue mapping
   * @private
   * @param languages {Array}
   * @param namespaces {Array}
   * @returns {String}
   */
  static _readMultiExpressionAttributeValuesMapper(languages, namespaces) {
    const expressionAttributeValues = {};
    languages.forEach((lang, index) => { expressionAttributeValues[`:lang${index}`] = lang; });
    namespaces.forEach((ns, index) => { expressionAttributeValues[`:namespace${index}`] = ns; });
    return expressionAttributeValues;
  }


  /**
   * Given some languages and/or namespaces as string array returns an array of translations
   * @param languages {Array}
   * @param namespaces {Array}
   * @param callback {Function}
   */
  readMulti(languages, namespaces, callback) {
    const {
      range,
      tableName,
      documentClient,
      query: KeyConditionExpression = this._readMultiQueryBuilder(languages, namespaces)
    } = this.options;
    if (!documentClient) {
      callback(null, null);
    } else {
      const ExpressionAttributeValues = this._readMultiExpressionAttributeValuesMapper(languages, namespaces);
      const getDocumentsQuery = {
        TableName: tableName,
        ScanIndexForward: true,
        KeyConditionExpression,
        ExpressionAttributeValues,
        Select: 'ALL'
      };
      const documentsQuery = documentClient.query(getDocumentsQuery).promise();
      documentsQuery()
        .catch(callback)
        .then((data) => {
          const response = {};
          data.Items.forEach((item) => {
            response[item.language] = { [range]: {} };
            response[item.language][range] = item.translations;
          });
          callback(null, response);
        });
    }
  }
}

I18NextDynamoDbBackend.type = 'backend';

export default I18NextDynamoDbBackend;
