(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.i18nextDynamoDBBackend = factory());
}(this, (function () { 'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var getDefaults = function getDefaults() {
  return {
    hash: 'lang',
    tableName: 'i18n',
    range: 'namespace',
    documentClient: null,
    translationsKey: 'data'
  };
};

/**
 * @class
 * I18next backend plugin
 */

var I18NextDynamoDbBackend = function () {
  /**
   * Create a i18next dynamodb plugin instance.
   * @constructor
   * @param {Object} services
   * @param {{documentClient: object, hash: string, range: string, tableName: string, translationsKey: string}} options
   */
  function I18NextDynamoDbBackend(services) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    var allOptions = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    _classCallCheck(this, I18NextDynamoDbBackend);

    this.init(services, options, allOptions);
    this.type = 'backend';
  }

  /**
   * Initialize DynamoDB plugin
   * @param services {Object}
   * @param options {{documentClient: object, hash: string, range: string, tableName: string, translationsKey: string}}
   * @param coreOptions {Object}
   */


  _createClass(I18NextDynamoDbBackend, [{
    key: 'init',
    value: function init(services, options, coreOptions) {
      this.services = services;
      this.options = _extends({}, getDefaults(), this.options, options);
      this.coreOptions = coreOptions;
    }

    /**
     *
     * @param language {String}
     * @param namespace {String}
     * @param callback {Function}
     */

  }, {
    key: 'read',
    value: function read(language, namespace, callback) {
      var _options = this.options,
          documentClient = _options.documentClient,
          hash = _options.hash,
          range = _options.range,
          tableName = _options.tableName,
          translationsKey = _options.translationsKey;

      if (!documentClient) {
        callback(null, null);
      } else {
        var _Key;

        var getDocumentQuery = {
          TableName: tableName,
          Key: (_Key = {}, _defineProperty(_Key, hash, language), _defineProperty(_Key, range, namespace), _Key),
          AttributesToGet: [translationsKey]
        };
        var getItemPromise = documentClient.get(getDocumentQuery).promise();
        getItemPromise.catch(callback).then(function (data) {
          return callback(null, data.Item && data.Item[translationsKey]);
        });
      }
    }

    /**
     * Given some languages and/or some namespaces returns a Dynamodb query
     * @private
     * @param languages {Array}
     * @param namespaces {Array}
     * @returns {String}
     */

  }, {
    key: '_readMultiQueryBuilder',
    value: function _readMultiQueryBuilder(languages, namespaces) {
      var _options2 = this.options,
          hash = _options2.hash,
          range = _options2.range;

      var namespaceQuery = namespaces.map(function (ns, index) {
        return '(' + range + ' = :namespace' + index + ')';
      }).join(' or ');
      return languages.map(function (lang, index) {
        return '(' + hash + ' = :lang' + index + ' and (' + namespaceQuery + ')';
      }).join(' or ');
    }

    /**
     * Given some languages and/or some namespaces returns a Dynamodb query attributeValue mapping
     * @private
     * @param languages {Array}
     * @param namespaces {Array}
     * @returns {String}
     */

  }, {
    key: 'readMulti',


    /**
     * Given some languages and/or namespaces as string array returns an array of translations
     * @param languages {Array}
     * @param namespaces {Array}
     * @param callback {Function}
     */
    value: function readMulti(languages, namespaces, callback) {
      var _options3 = this.options,
          range = _options3.range,
          tableName = _options3.tableName,
          documentClient = _options3.documentClient,
          _options3$query = _options3.query,
          KeyConditionExpression = _options3$query === undefined ? this._readMultiQueryBuilder(languages, namespaces) : _options3$query;

      if (!documentClient) {
        callback(null, null);
      } else {
        var ExpressionAttributeValues = this._readMultiExpressionAttributeValuesMapper(languages, namespaces);
        var getDocumentsQuery = {
          TableName: tableName,
          ScanIndexForward: true,
          KeyConditionExpression: KeyConditionExpression,
          ExpressionAttributeValues: ExpressionAttributeValues,
          Select: 'ALL'
        };
        var documentsQuery = documentClient.query(getDocumentsQuery).promise();
        documentsQuery().catch(callback).then(function (data) {
          var response = {};
          data.Items.forEach(function (item) {
            response[item.language] = _defineProperty({}, range, {});
            response[item.language][range] = item.translations;
          });
          callback(null, response);
        });
      }
    }
  }], [{
    key: '_readMultiExpressionAttributeValuesMapper',
    value: function _readMultiExpressionAttributeValuesMapper(languages, namespaces) {
      var expressionAttributeValues = {};
      languages.forEach(function (lang, index) {
        expressionAttributeValues[':lang' + index] = lang;
      });
      namespaces.forEach(function (ns, index) {
        expressionAttributeValues[':namespace' + index] = ns;
      });
      return expressionAttributeValues;
    }
  }]);

  return I18NextDynamoDbBackend;
}();

I18NextDynamoDbBackend.type = 'backend';

return I18NextDynamoDbBackend;

})));
