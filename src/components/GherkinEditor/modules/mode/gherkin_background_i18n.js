/* istanbul ignore file */
import { getGherkinDialect } from '../dialects/gherkin_background_i18n'
import escapeStringRegexp from 'escape-string-regexp'

/* global ace */
ace.define(
  'ace/mode/gherkin_background_highlight_rules',
  [
    'require',
    'exports',
    'module',
    'ace/lib/oop',
    'ace/mode/text_highlight_rules'
  ],
  function (acequire, exports, module) {
    var oop = acequire('../lib/oop')
    var TextHighlightRules = acequire('./text_highlight_rules')
      .TextHighlightRules
    var stringEscape =
      '\\\\(x[0-9A-Fa-f]{2}|[0-7]{3}|[\\\\abfnrtv\'"]|U[0-9A-Fa-f]{8}|u[0-9A-Fa-f]{4})'

    var GherkinHighlightRules = function () {
      var labels = getGherkinDialect().labels
      var keywords = getGherkinDialect().keywords

      this.$rules = {
        start: [
          {
            token: 'constant.numeric',
            regex: '(?:(?:[1-9]\\d*)|(?:0))'
          },
          {
            token: 'comment',
            regex: '#.*$'
          },
          {
            token: 'keyword',
            regex:
              '(?:' +
              labels.map(escapeStringRegexp).join('|') +
              '):|(?:' +
              keywords.map(escapeStringRegexp).join('|') +
              ')\\b'
          },
          {
            token: 'string', // multi line """ string start
            regex: '"{3}',
            next: 'qqstring3'
          },
          {
            token: 'string', // " string
            regex: '"',
            next: 'qqstring'
          },
          {
            token: 'text',
            regex: '^\\s*(?=@[\\w])',
            next: [
              {
                token: 'text',
                regex: '\\s+'
              },
              {
                token: 'variable.parameter',
                regex: '@[\\w]+'
              },
              {
                token: 'empty',
                regex: '',
                next: 'start'
              }
            ]
          },
          {
            token: 'argument',
            regex: '<[^>]+>'
          },
          {
            token: 'comment',
            regex: '\\|(?=.)',
            next: 'table-item'
          },
          {
            token: 'comment',
            regex: '\\|$',
            next: 'start'
          }
        ],
        qqstring3: [
          {
            token: 'constant.language.escape',
            regex: stringEscape
          },
          {
            token: 'string', // multi line """ string end
            regex: '"{3}',
            next: 'start'
          },
          {
            defaultToken: 'string'
          }
        ],
        qqstring: [
          {
            token: 'constant.language.escape',
            regex: stringEscape
          },
          {
            token: 'string',
            regex: '\\\\$',
            next: 'qqstring'
          },
          {
            token: 'string',
            regex: '"|$',
            next: 'start'
          },
          {
            defaultToken: 'string'
          }
        ],
        'table-item': [
          {
            token: 'comment',
            regex: /$/,
            next: 'start'
          },
          {
            token: 'comment',
            regex: /\|/
          },
          {
            token: 'string',
            regex: /\\./
          },
          {
            defaultToken: 'string'
          }
        ]
      }
      this.normalizeRules()
    }

    oop.inherits(GherkinHighlightRules, TextHighlightRules)

    exports.GherkinHighlightRules = GherkinHighlightRules
  }
)

ace.define(
  'ace/mode/gherkin_background_i18n',
  [
    'require',
    'exports',
    'module',
    'ace/lib/oop',
    'ace/mode/text',
    'ace/mode/gherkin_background_highlight_rules'
  ],
  function (acequire, exports, module) {
    var oop = acequire('../lib/oop')
    var TextMode = acequire('./text').Mode
    var GherkinHighlightRules = acequire('./gherkin_background_highlight_rules')
      .GherkinHighlightRules

    var Mode = function () {
      this.HighlightRules = GherkinHighlightRules
      this.$behaviour = this.$defaultBehaviour
    }
    oop.inherits(Mode, TextMode)
    ;(function () {
      this.lineCommentStart = '#'
      this.$id = 'ace/mode/gherkin_background_i18n'

      this.getNextLineIndent = function (state, line, tab) {
        var labels = getGherkinDialect().labels
        var keywords = getGherkinDialect().keywords

        var indent = this.$getIndent(line)
        var space2 = '  '

        var tokenizedLine = this.getTokenizer().getLineTokens(line, state)
        var tokens = tokenizedLine.tokens

        if (line.match('[ ]*\\|')) {
          indent += '| '
        }

        if (tokens.length && tokens[tokens.length - 1].type === 'comment') {
          return indent
        }

        if (state === 'start') {
          if (line.match(labels.map(escapeStringRegexp).join(':|') + ':')) {
            indent += space2
          } else if (
            line.match(
              '(' +
                keywords.map(escapeStringRegexp).join('|') +
                ').+(:)$|Examples:'
            )
          ) {
            indent += space2
          } else if (line.match('\\*.+')) {
            indent += '* '
          }
        }

        return indent
      }
    }.call(Mode.prototype))

    exports.Mode = Mode
  }
)
