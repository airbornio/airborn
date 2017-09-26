(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (factory((global.cherow = {})));
}(this, (function (exports) { 'use strict';

var hasOwn = Object.prototype.hasOwnProperty;
function tryCreate(pattern, flags) {
    try {
        return new RegExp(pattern, flags);
    }
    catch (e) {
        return null;
    }
}
/**
 * Convert code points
 * @param codePoint
 */
function fromCodePoint(codePoint) {
    if (codePoint <= 0xFFFF)
        { return String.fromCharCode(codePoint); }
    return String.fromCharCode(((codePoint - 0x10000) >> 10) + 0x0D800, ((codePoint - 0x10000) & (1024 - 1)) + 0x0DC00);
}
function toHex(code) {
    if (code < 48 /* Zero */)
        { return -1; }
    if (code <= 57 /* Nine */)
        { return code - 48 /* Zero */; }
    if (code < 65 /* UpperA */)
        { return -1; }
    if (code <= 70 /* UpperF */)
        { return code - 65 /* UpperA */ + 10; }
    if (code < 97 /* LowerA */)
        { return -1; }
    if (code <= 102 /* LowerF */)
        { return code - 97 /* LowerA */ + 10; }
    return -1;
}
/**
 * Returns true if the "node" contains a directive prologue
 *
 * @param node Statement
 */
/**
 * Returns true if the "node" contains a directive prologue
 *
 * @param node Statement
 */
function isDirective(node) {
    return node.type === 'ExpressionStatement' &&
        node.expression.type === 'Literal' &&
        typeof node.expression.value === 'string';
}
/**
 * Returns true if match
 *
 * @param mask number
 * @param flags number
 */
function hasMask(mask, flags) {
    return (mask & flags) === flags;
}
// Fully qualified element name, e.g. <svg:path> returns "svg:path"
function getQualifiedJSXName(elementName) {
    switch (elementName.type) {
        case 'JSXIdentifier':
            return elementName.name;
        case 'JSXNamespacedName':
            return elementName.namespace + ':' + elementName.name;
        case 'JSXMemberExpression':
            return (getQualifiedJSXName(elementName.object) + '.' +
                getQualifiedJSXName(elementName.property));
        /* istanbul ignore next */
        default:
    }
}
function isStartOfExpression(t, inJSXContext) {
    switch (t) {
        case 131073 /* Identifier */:
        case 131091 /* LeftBracket */:
        case 131084 /* LeftBrace */:
        case 11 /* LeftParen */:
        case 12294 /* TrueKeyword */:
        case 3 /* StringLiteral */:
        case 2 /* NumericLiteral */:
        case 3148079 /* Add */:
        case 3148080 /* Subtract */:
        case 4214856 /* LetKeyword */:
        case 2097197 /* Negate */:
        case 2097198 /* Complement */:
        case 262172 /* Decrement */:
        case 262171 /* Increment */:
        case 12375 /* FunctionKeyword */:
        case 12378 /* NewKeyword */:
        case 1051189 /* Divide */:
        case 524325 /* DivideAssign */:
        case 12365 /* ClassKeyword */:
        case 2109483 /* DeleteKeyword */:
        case 8 /* TemplateCont */:
        case 9 /* TemplateTail */:
        case 2109484 /* VoidKeyword */:
        case 20586 /* YieldKeyword */:
        case 12380 /* SuperKeyword */:
        case 12382 /* ThisKeyword */:
        case 2109482 /* TypeofKeyword */:
        case 12293 /* FalseKeyword */:
        case 12377 /* ImportKeyword */:
        case 12295 /* NullKeyword */:
        case 2162797 /* AwaitKeyword */:
            return true;
        case 1050431 /* LessThan */:
            return inJSXContext;
        default:
            return false;
    }
}
function isValidDestructuringAssignmentTarget(expr) {
    switch (expr.type) {
        case 'Identifier':
        case 'ArrayExpression':
        case 'ArrayPattern':
        case 'ObjectExpression':
        case 'ObjectPattern':
        case 'MemberExpression':
        case 'ClassExpression':
        case 'CallExpression':
        case 'TemplateLiteral':
        case 'AssignmentExpression':
        case 'NewExpression':
            return true;
        default:
            return false;
    }
}
function isValidSimpleAssignmentTarget(expr) {
    switch (expr.type) {
        case 'Identifier':
        case 'MemberExpression':
            return true;
        default:
            return false;
    }
}
function isKeyword(context, t) {
    switch (t) {
        case 65643 /* AsKeyword */:
        case 65644 /* AsyncKeyword */:
        case 12362 /* BreakKeyword */:
        case 12363 /* CaseKeyword */:
        case 12364 /* CatchKeyword */:
        case 12365 /* ClassKeyword */:
        case 4206665 /* ConstKeyword */:
        case 65646 /* ConstructorKeyword */:
        case 12366 /* ContinueKeyword */:
        case 12367 /* DebuggerKeyword */:
        case 12368 /* DefaultKeyword */:
        case 2109483 /* DeleteKeyword */:
        case 12369 /* DoKeyword */:
        case 12370 /* ElseKeyword */:
        case 12371 /* ExportKeyword */:
        case 12372 /* ExtendsKeyword */:
        case 12293 /* FalseKeyword */:
        case 12373 /* FinallyKeyword */:
        case 12374 /* ForKeyword */:
        case 12403 /* EnumKeyword */:
        case 65649 /* FromKeyword */:
        case 12375 /* FunctionKeyword */:
        case 65647 /* GetKeyword */:
        case 12376 /* IfKeyword */:
        case 20579 /* ImplementsKeyword */:
        case 12377 /* ImportKeyword */:
        case 1062705 /* InKeyword */:
        case 1062706 /* InstanceofKeyword */:
        case 20580 /* InterfaceKeyword */:
        case 4214856 /* LetKeyword */:
        case 12378 /* NewKeyword */:
        case 12295 /* NullKeyword */:
        case 65650 /* OfKeyword */:
        case 20581 /* PackageKeyword */:
        case 20582 /* PrivateKeyword */:
        case 20583 /* ProtectedKeyword */:
        case 20584 /* PublicKeyword */:
        case 12379 /* ReturnKeyword */:
        case 65648 /* SetKeyword */:
        case 20585 /* StaticKeyword */:
        case 12380 /* SuperKeyword */:
        case 12381 /* SwitchKeyword */:
        case 12382 /* ThisKeyword */:
        case 12383 /* ThrowKeyword */:
        case 12294 /* TrueKeyword */:
        case 12384 /* TryKeyword */:
        case 2109482 /* TypeofKeyword */:
        case 4206663 /* VarKeyword */:
        case 2109484 /* VoidKeyword */:
        case 12385 /* WhileKeyword */:
        case 12386 /* WithKeyword */:
            return true;
        default:
            return false;
    }
}

var ErrorMessages = {};
ErrorMessages[0 /* Unexpected */] = 'Unexpected token';
ErrorMessages[1 /* UnexpectedToken */] = 'Unexpected token \'%0\'';
ErrorMessages[2 /* UnterminatedComment */] = 'Unterminated comment';
ErrorMessages[3 /* UnterminatedString */] = 'Unterminated string literal';
ErrorMessages[4 /* UnterminatedRegExp */] = 'Unterminated regular expression literal';
ErrorMessages[5 /* UnicodeOutOfRange */] = 'Unicode escape code point out of range';
ErrorMessages[6 /* InvalidUnicodeEscapeSequence */] = 'Invalid Unicode escape sequence';
ErrorMessages[7 /* StrictOctalEscape */] = 'Octal escapes are not allowed in strict mode';
ErrorMessages[8 /* InvalidEightAndNine */] = 'Escapes \\8 or \\9 are not syntactically valid escapes';
ErrorMessages[9 /* StrictOctalLiteral */] = 'Octal literals are not allowed in strict mode';
ErrorMessages[10 /* MissingShebangExclamation */] = 'Missing exclamation in shebang';
ErrorMessages[11 /* DuplicateRegExpFlag */] = 'Duplicate flags supplied to RegExp constructor %0';
ErrorMessages[12 /* UnexpectedTokenRegExp */] = 'Unexpected regular expression';
ErrorMessages[13 /* UnexpectedTokenRegExpFlag */] = 'Unexpected regular expression flag';
ErrorMessages[14 /* BadImportCallArity */] = 'Dynamic import must have one specifier as an argument';
ErrorMessages[15 /* StrictFunction */] = 'In strict mode code, functions can only be declared at top level or inside a block';
ErrorMessages[16 /* BadContinue */] = 'Continue must be inside loop or switch statement';
ErrorMessages[17 /* IllegalBreak */] = 'Unlabeled break must be inside loop or switch';
ErrorMessages[19 /* IllegalReturn */] = 'Illegal return statement';
ErrorMessages[18 /* MultipleDefaultsInSwitch */] = 'More than one default clause in switch statement';
ErrorMessages[20 /* NoCatchOrFinally */] = 'Missing catch or finally after try';
ErrorMessages[21 /* NewlineAfterThrow */] = 'Illegal newline after throw';
ErrorMessages[22 /* StrictModeWith */] = 'Strict mode code may not include a with statement';
ErrorMessages[23 /* DefaultRestProperty */] = 'Unexpected token =';
ErrorMessages[25 /* BadGetterArity */] = 'Getter must not have any formal parameters';
ErrorMessages[26 /* BadSetterArity */] = 'Setter must have exactly one formal parameter';
ErrorMessages[27 /* BadSetterRestParameter */] = 'Setter function argument must not be a rest parameter';
ErrorMessages[28 /* DefaultRestParameter */] = 'Unexpected token =';
ErrorMessages[29 /* IllegalUseStrict */] = 'Illegal \'use strict\' directive in function with non-simple parameter list';
ErrorMessages[30 /* ParameterAfterRestParameter */] = 'Rest parameter must be last formal parameter';
ErrorMessages[85 /* UnexpectedRestElement */] = 'Unexpected Rest element';
ErrorMessages[31 /* StrictFunctionName */] = 'Function name may not be eval or arguments in strict mode code';
ErrorMessages[32 /* UnexpectedNewTarget */] = 'new.target expression is not allowed here';
ErrorMessages[33 /* MetaNotInFunctionBody */] = 'new.target must be in the body of a function';
ErrorMessages[34 /* DeclarationMissingInitializer */] = 'Missing initializer in %0 declaration';
ErrorMessages[36 /* InvalidLHSInForLoop */] = 'Invalid left-hand side in for-loop';
ErrorMessages[35 /* InvalidVarInitForOf */] = 'Invalid variable declaration in for-of statement';
ErrorMessages[37 /* UninitalizedBindingPatternForInit */] = 'Binding pattern appears without initializer in for statement init';
ErrorMessages[38 /* InvalidLHSInForIn */] = 'Invalid left-hand side in for-in';
ErrorMessages[24 /* PropertyAfterRestProperty */] = 'Unexpected token';
ErrorMessages[39 /* StrictLHSAssignment */] = 'Eval or arguments can\'t be assigned to in strict mode code';
ErrorMessages[40 /* InvalidLHSInAssignment */] = 'Invalid left-hand side in assignment';
ErrorMessages[41 /* UnexpectedArrow */] = 'No line break is allowed before \'=>\'';
ErrorMessages[89 /* MissingArrowAfterParentheses */] = 'Missing => after parentheses';
ErrorMessages[83 /* UnexpectedRest */] = 'Unexpected token ...';
ErrorMessages[42 /* MissingAsImportSpecifier */] = 'Missing \'as\' keyword in import namespace specifier';
ErrorMessages[43 /* NoAsAfterImportNamespace */] = 'Missing \'as\' keyword after import namespace';
ErrorMessages[44 /* InvalidModuleSpecifier */] = 'Invalid module specifier';
ErrorMessages[45 /* NonEmptyJSXExpression */] = 'JSX attributes must only be assigned a non-empty  \'expression\'';
ErrorMessages[46 /* ExpectedJSXClosingTag */] = 'Expected corresponding JSX closing tag for %0';
ErrorMessages[47 /* AdjacentJSXElements */] = 'Adjacent JSX elements must be wrapped in an enclosing tag';
ErrorMessages[48 /* UnknownJSXChildKind */] = 'Unknown JSX child kind %0';
ErrorMessages[49 /* InvalidJSXAttributeValue */] = 'JSX value should be either an expression or a quoted JSX text';
ErrorMessages[50 /* InvalidBinaryDigit */] = 'Invalid binary digit';
ErrorMessages[51 /* InvalidOctalDigit */] = 'Invalid octal digit';
ErrorMessages[52 /* StrictDelete */] = 'Delete of an unqualified identifier in strict mode.';
ErrorMessages[53 /* StrictLHSPrefix */] = 'Prefix increment/decrement may not have eval or arguments operand in strict mode';
ErrorMessages[54 /* StrictLHSPostfix */] = 'Postfix increment/decrement may not have eval or arguments operand in strict mode';
ErrorMessages[57 /* ExportDeclAtTopLevel */] = 'Export declarations may only appear at top level of a module';
ErrorMessages[58 /* ImportDeclAtTopLevel */] = 'Import declarations may only appear at top level of a module';
ErrorMessages[56 /* UnexpectedFromKeyword */] = 'Expexted \'from\'';
ErrorMessages[59 /* MissingMsgDeclarationAfterExport */] = 'Missing declaration after \'export\' keyword';
ErrorMessages[60 /* MissingMsgDeclarationAfterImport */] = 'Missing declaration after \'import\' keyword';
ErrorMessages[61 /* ExpectedNamedOrNamespaceImport */] = 'Expected named imports or namespace import after comma';
ErrorMessages[62 /* MissingExportFromKeyword */] = 'Missing keyword from after import clause';
ErrorMessages[100 /* UnsupportedObjectSpread */] = 'Unsupported Object rest spread';
ErrorMessages[63 /* NotAnAsyncGenerator */] = 'Invalid async generator';
ErrorMessages[64 /* ForAwaitNotOf */] = 'For await loop should be used with \'of\'';
ErrorMessages[65 /* ExportImportInModuleCode */] = '%0 may only be used with module code';
ErrorMessages[66 /* LetInLexicalBinding */] = 'let is disallowed as a lexically bound name';
ErrorMessages[67 /* MissingVariableName */] = 'Missing variable name';
ErrorMessages[68 /* InvalidStartOfExpression */] = 'Invalid start of an expression';
ErrorMessages[69 /* UnexpectedComma */] = 'Unexpected token ,';
ErrorMessages[70 /* DuplicateProtoProperty */] = 'Duplicate __proto__ fields are not allowed in object literals';
ErrorMessages[71 /* StrictParamDupe */] = 'Strict mode function may not have duplicate parameter names';
ErrorMessages[72 /* MissingExponent */] = 'Float tail must contain digits';
ErrorMessages[73 /* ExpectedHexDigits */] = 'Expected hexadecimal digits';
ErrorMessages[74 /* InvalidHexEscapeSequence */] = 'Invalid hexadecimal escape sequence';
ErrorMessages[75 /* ConstructorSpecialMethod */] = 'Class constructor may not be an accessor';
ErrorMessages[84 /* InvalidTrailingComma */] = 'Unexpeced ,';
ErrorMessages[76 /* BadSuperCall */] = 'super() is only valid in derived class constructors';
ErrorMessages[77 /* DuplicateConstructor */] = 'A class may only have one constructor';
ErrorMessages[79 /* ConstructorIsAsync */] = 'Class constructor may not be an async method';
ErrorMessages[78 /* StaticPrototype */] = 'Classes may not have static property named prototype';
ErrorMessages[81 /* ClassDeclarationNoName */] = 'Class declaration must have a name in this context';
ErrorMessages[82 /* FunctionDeclarationNoName */] = 'Function declaration must have a name in this context';
ErrorMessages[86 /* InvalidContextualKeyword */] = 'A contextual keyword must not contain escaped characters';
ErrorMessages[87 /* LineBreakAfterAsync */] = 'No line break is allowed after async';
ErrorMessages[88 /* InvalidEscapedReservedWord */] = 'Keyword must not contain escaped characters';
ErrorMessages[90 /* InvalidShorthandPropertyAssignment */] = 'Shorthand property assignments are only valid in destructuring patterns';
ErrorMessages[91 /* InvalidParenthesizedPattern */] = 'Invalid parenthesized pattern';
ErrorMessages[92 /* DuplicateIdentifier */] = '\'%0\' has already been declared ';
ErrorMessages[93 /* DuplicateBinding */] = 'Duplicate binding';
ErrorMessages[94 /* Redeclaration */] = 'Label \'%0\' has already been declared';
ErrorMessages[98 /* UnknownLabel */] = 'Undefined label \'%0\'';
ErrorMessages[96 /* AsyncGeneratorInLegacyContext */] = 'Async and async Generator declarations are not allowed in legacy contexts';
ErrorMessages[97 /* AsyncInLegacyContext */] = 'Async declarations are not allowed in legacy contexts';
ErrorMessages[95 /* GeneratorInLegacyContext */] = 'Generator declarations are not allowed in legacy contexts';
ErrorMessages[99 /* InvalidOrUnexpectedToken */] = 'Invalid or unexpected token';
ErrorMessages[101 /* InvalidLHSInArrow */] = ' Invalid left-hand side in arrow function parameters';
ErrorMessages[102 /* InvalidNewTargetContext */] = 'new.target expression is not allowed here';
ErrorMessages[103 /* UnexpectedReservedWord */] = 'Unexpected reserved word';
ErrorMessages[104 /* InvalidShorthandProperty */] = '\'%0\' can not be used as shorthand property';
ErrorMessages[105 /* TemplateOctalLiteral */] = 'Octal escape sequences are not allowed in template strings.';
ErrorMessages[106 /* UnterminatedTemplate */] = 'Unterminated template literal';
ErrorMessages[107 /* UnexpectedEOS */] = 'Unexpected end of input';
ErrorMessages[108 /* UnexpectedStrictReserved */] = 'Unexpected strict mode reserved word';
ErrorMessages[109 /* YieldReservedWord */] = 'yield is a reserved word inside generator functions';
ErrorMessages[110 /* YieldInParameter */] = 'Yield expression not allowed in formal parameter';
ErrorMessages[111 /* GeneratorParameter */] = 'Generator parameters must not contain yield expressions';
ErrorMessages[112 /* StrictParamName */] = 'The identifier \'eval\' or \'arguments\' must not be in binding position in strict mode';
ErrorMessages[113 /* DisallowedInContext */] = '\'%0\' may not be used as an identifier in this context';
ErrorMessages[114 /* IllegalArrowInParamList */] = 'Illegal arrow function parameter list';
ErrorMessages[115 /* UnexpectedBigIntLiteral */] = 'Unexpected BigInt literal';
ErrorMessages[116 /* UnNamedClassStmt */] = 'Class statement requires a name';
ErrorMessages[117 /* UnNamedFunctionStmt */] = 'Function statement requires a name';
ErrorMessages[118 /* InvalidStrictExpPostion */] = 'The identifier \'%0\' must not be in expression position in strict mode';
ErrorMessages[119 /* InvalidStrictLexical */] = 'Lexical declarations must not have a binding named "let"';
ErrorMessages[120 /* MissingInitializer */] = 'Missing initializer';
ErrorMessages[121 /* InvalidLabeledForOf */] = 'The body of a for-of statement must not be a labeled function declaration';
ErrorMessages[122 /* InvalidVarDeclInForIn */] = 'Invalid variable declaration in for-in statement';
ErrorMessages[124 /* InvalidNoctalInteger */] = 'Unexpected noctal integer literal';
ErrorMessages[125 /* InvalidRadix */] = 'Expected number in radix';
ErrorMessages[126 /* UnexpectedTokenNumber */] = 'Unexpected number';
ErrorMessages[127 /* UnexpectedMantissa */] = 'Unexpected mantissa';
ErrorMessages[128 /* UnexpectedSurrogate */] = 'Unexpected surrogate pair';
function constructError(msg, column) {
    var error = new Error(msg);
    try {
        throw error;
    }
    catch (base) {
        // istanbul ignore else
        if (Object.create && Object.defineProperty) {
            error = Object.create(base);
            Object.defineProperty(error, 'column', {
                value: column
            });
        }
    }
    // istanbul ignore next
    return error;
}
function createError(type, loc) {
    var params = [], len = arguments.length - 2;
    while ( len-- > 0 ) params[ len ] = arguments[ len + 2 ];

    var description = ErrorMessages[type].replace(/%(\d+)/g, function (_, i) { return params[i]; });
    var error = constructError('Line ' + loc.line + ': ' + description, loc.column);
    error.index = loc.index;
    error.lineNumber = loc.line;
    error.description = description;
    return error;
}

var KeywordDescTable = [
    'end of source',
    /* Constants/Bindings */
    'identifier', 'number', 'string', 'regular expression',
    'false', 'true', 'null',
    /* Template nodes */
    'template continuation', 'template end',
    /* Punctuators */
    '=>', '(', '{', '.', '...', '}', ')', ';', ',', '[', ']', ':', '?', '\'', '"', '</', '/>',
    /* Update operators */
    '++', '--',
    /* Assign operators */
    '=', '<<=', '>>=', '>>>=', '**=', '+=', '-=', '*=', '/=', '%=', '^=', '|=',
    '&=',
    /* Unary/binary operators */
    'typeof', 'delete', 'void', '!', '~', '+', '-', 'in', 'instanceof', '*', '%', '/', '**', '&&',
    '||', '===', '!==', '==', '!=', '<=', '>=', '<', '>', '<<', '>>', '>>>', '&', '|', '^',
    /* Variable declaration kinds */
    'var', 'let', 'const',
    /* Other reserved words */
    'break', 'case', 'catch', 'class', 'continue', 'debugger', 'default', 'do', 'else', 'export',
    'extends', 'finally', 'for', 'function', 'if', 'import', 'new', 'return', 'super', 'switch',
    'this', 'throw', 'try', 'while', 'with',
    /* Strict mode reserved words */
    'implements', 'interface', 'package', 'private', 'protected', 'public', 'static', 'yield',
    /* Contextual keywords */
    'as', 'async', 'await', 'constructor', 'get', 'set', 'from', 'of',
    'enum'
];
/**
 * The conversion function between token and its string description/representation.
 */
function tokenDesc(token) {
    return KeywordDescTable[token & 255 /* Type */];
}
// Used `Object.create(null)` to avoid potential `Object.prototype`
// interference.
var DescKeywordTable = Object.create(null, {
    as: { value: 65643 /* AsKeyword */ },
    async: { value: 65644 /* AsyncKeyword */ },
    await: { value: 2162797 /* AwaitKeyword */ },
    break: { value: 12362 /* BreakKeyword */ },
    case: { value: 12363 /* CaseKeyword */ },
    catch: { value: 12364 /* CatchKeyword */ },
    class: { value: 12365 /* ClassKeyword */ },
    const: { value: 4206665 /* ConstKeyword */ },
    constructor: { value: 65646 /* ConstructorKeyword */ },
    continue: { value: 12366 /* ContinueKeyword */ },
    debugger: { value: 12367 /* DebuggerKeyword */ },
    default: { value: 12368 /* DefaultKeyword */ },
    delete: { value: 2109483 /* DeleteKeyword */ },
    do: { value: 12369 /* DoKeyword */ },
    enum: { value: 12403 /* EnumKeyword */ },
    else: { value: 12370 /* ElseKeyword */ },
    export: { value: 12371 /* ExportKeyword */ },
    extends: { value: 12372 /* ExtendsKeyword */ },
    false: { value: 12293 /* FalseKeyword */ },
    finally: { value: 12373 /* FinallyKeyword */ },
    for: { value: 12374 /* ForKeyword */ },
    from: { value: 65649 /* FromKeyword */ },
    function: { value: 12375 /* FunctionKeyword */ },
    get: { value: 65647 /* GetKeyword */ },
    if: { value: 12376 /* IfKeyword */ },
    implements: { value: 20579 /* ImplementsKeyword */ },
    import: { value: 12377 /* ImportKeyword */ },
    in: { value: 1062705 /* InKeyword */ },
    instanceof: { value: 1062706 /* InstanceofKeyword */ },
    interface: { value: 20580 /* InterfaceKeyword */ },
    let: { value: 4214856 /* LetKeyword */ },
    new: { value: 12378 /* NewKeyword */ },
    null: { value: 12295 /* NullKeyword */ },
    of: { value: 65650 /* OfKeyword */ },
    package: { value: 20581 /* PackageKeyword */ },
    private: { value: 20582 /* PrivateKeyword */ },
    protected: { value: 20583 /* ProtectedKeyword */ },
    public: { value: 20584 /* PublicKeyword */ },
    return: { value: 12379 /* ReturnKeyword */ },
    set: { value: 65648 /* SetKeyword */ },
    static: { value: 20585 /* StaticKeyword */ },
    super: { value: 12380 /* SuperKeyword */ },
    switch: { value: 12381 /* SwitchKeyword */ },
    this: { value: 12382 /* ThisKeyword */ },
    throw: { value: 12383 /* ThrowKeyword */ },
    true: { value: 12294 /* TrueKeyword */ },
    try: { value: 12384 /* TryKeyword */ },
    typeof: { value: 2109482 /* TypeofKeyword */ },
    var: { value: 4206663 /* VarKeyword */ },
    void: { value: 2109484 /* VoidKeyword */ },
    while: { value: 12385 /* WhileKeyword */ },
    with: { value: 12386 /* WithKeyword */ },
    yield: { value: 20586 /* YieldKeyword */ },
});
function descKeyword(value) {
    return (DescKeywordTable[value] | 0);
}

var convert = (function (compressed, dict) {
    var result = new Uint32Array(104448);
    var index = 0;
    var subIndex = 0;
    while (index < 3293) {
        var inst = compressed[index++];
        if (inst < 0) {
            subIndex -= inst;
        }
        else {
            var code = compressed[index++];
            if (inst & 2)
                { code = dict[code]; }
            if (inst & 1) {
                result.fill(code, subIndex, subIndex += compressed[index++]);
            }
            else {
                result[subIndex++] = code;
            }
        }
    }
    return result;
})([-1, 2, 28, 2, 29, 2, 5, -1, 0, 77595648, 3, 41, 2, 3, 0, 14, 2, 52, 2, 53, 3, 0, 3, 0, 3168796671, 0, 4294956992, 2, 1, 2, 0, 2, 54, 3, 0, 4, 0, 4294966523, 3, 0, 4, 2, 55, 2, 56, 2, 4, 0, 4294836479, 0, 3221225471, 0, 4294901942, 2, 57, 0, 134152192, 3, 0, 2, 0, 4294951935, 3, 0, 2, 0, 2683305983, 0, 2684354047, 2, 17, 2, 0, 0, 4294961151, 3, 0, 2, 2, 20, 2, 0, 2, 59, 2, 0, 2, 125, 2, 6, 2, 19, -1, 2, 60, 2, 148, 2, 1, 3, 0, 3, 0, 4294901711, 2, 37, 0, 4089839103, 0, 2961209759, 0, 268697551, 0, 4294543342, 0, 3547201023, 0, 1577204103, 0, 4194240, 0, 4294688750, 2, 2, 0, 80831, 0, 4261478351, 0, 4294549486, 2, 2, 0, 2965387679, 0, 196559, 0, 3594373100, 0, 3288319768, 0, 8469959, 2, 167, 2, 3, 0, 3825204735, 0, 123747807, 0, 65487, 2, 3, 0, 4092591615, 0, 1080049119, 0, 458703, 2, 3, 2, 0, 0, 2163244511, 0, 4227923919, 0, 4236247020, 2, 64, 0, 4284449919, 0, 851904, 2, 4, 2, 16, 0, 67076095, -1, 2, 65, 0, 1006628014, 0, 4093591391, -1, 0, 50331649, 0, 3265266687, 2, 34, 0, 4294844415, 0, 4278190047, 2, 22, 2, 124, -1, 3, 0, 2, 2, 33, 2, 0, 2, 10, 2, 0, 2, 14, 2, 15, 3, 0, 10, 2, 66, 2, 0, 2, 67, 2, 68, 2, 69, 2, 0, 2, 70, 2, 0, 0, 3892314111, 0, 261632, 2, 27, 3, 0, 2, 2, 11, 2, 4, 3, 0, 18, 2, 71, 2, 5, 3, 0, 2, 2, 72, 0, 2088959, 2, 31, 2, 8, 0, 909311, 3, 0, 2, 0, 814743551, 2, 39, 0, 67057664, 3, 0, 2, 2, 9, 2, 0, 2, 32, 2, 0, 2, 18, 2, 7, 0, 268374015, 2, 30, 2, 46, 2, 0, 2, 73, 0, 134153215, -1, 2, 6, 2, 0, 2, 7, 0, 2684354559, 0, 67044351, 0, 1073676416, -2, 3, 0, 2, 2, 40, 0, 1046528, 3, 0, 3, 2, 8, 2, 0, 2, 9, 0, 4294960127, 2, 10, 2, 13, -1, 0, 4294377472, 2, 25, 3, 0, 7, 0, 4227858431, 3, 0, 8, 2, 11, 2, 0, 2, 75, 2, 10, 2, 0, 2, 76, 2, 77, 2, 78, -1, 2, 121, 0, 1048577, 2, 79, 2, 12, -1, 2, 12, 0, 131042, 2, 80, 2, 81, 2, 82, 2, 0, 2, 13, -83, 2, 0, 2, 49, 2, 7, 3, 0, 4, 0, 1046559, 2, 0, 2, 14, 2, 0, 0, 2147516671, 2, 23, 3, 83, 2, 2, 0, -16, 2, 84, 0, 524222462, 2, 4, 2, 0, 0, 4269801471, 2, 4, 2, 0, 2, 15, 2, 74, 2, 86, 3, 0, 2, 2, 43, 2, 16, -1, 2, 17, -16, 3, 0, 205, 2, 18, -2, 3, 0, 655, 2, 19, 3, 0, 36, 2, 47, -1, 2, 17, 2, 10, 3, 0, 8, 2, 87, 2, 117, 2, 0, 0, 3220242431, 3, 0, 3, 2, 20, 2, 21, 2, 88, 3, 0, 2, 2, 89, 2, 90, -1, 2, 21, 2, 0, 2, 26, 2, 0, 2, 8, 3, 0, 2, 0, 67043391, 0, 687865855, 2, 0, 2, 24, 2, 8, 2, 22, 3, 0, 2, 0, 67076097, 2, 7, 2, 0, 2, 23, 0, 67059711, 0, 4236247039, 3, 0, 2, 0, 939524103, 0, 8191999, 2, 94, 2, 95, 2, 15, 2, 92, 3, 0, 3, 0, 67057663, 3, 0, 349, 2, 96, 2, 97, 2, 6, -264, 3, 0, 11, 2, 24, 3, 0, 2, 2, 25, -1, 0, 3774349439, 2, 98, 2, 99, 3, 0, 2, 2, 20, 2, 100, 3, 0, 10, 2, 10, 2, 17, 2, 0, 2, 42, 2, 0, 2, 26, 2, 101, 2, 27, 0, 1638399, 2, 165, 2, 102, 3, 0, 3, 2, 22, 2, 28, 2, 29, 2, 5, 2, 30, 2, 0, 2, 7, 2, 103, -1, 2, 104, 2, 105, 2, 106, -1, 3, 0, 3, 2, 16, -2, 2, 0, 2, 31, -3, 2, 144, -4, 2, 22, 2, 0, 2, 107, 0, 1, 2, 0, 2, 58, 2, 32, 2, 16, 2, 10, 2, 0, 2, 108, -1, 3, 0, 4, 2, 10, 2, 33, 2, 109, 2, 6, 2, 0, 2, 110, 2, 0, 2, 44, -4, 3, 0, 9, 2, 23, 2, 18, 2, 26, -4, 2, 111, 2, 112, 2, 18, 2, 23, 2, 7, -2, 2, 113, 2, 18, 2, 25, -2, 2, 0, 2, 114, -2, 0, 4277137519, 0, 2265972735, -1, 3, 22, 2, -1, 2, 34, 2, 36, 2, 0, 3, 18, 2, 2, 35, 2, 20, -3, 3, 0, 2, 2, 13, -1, 2, 0, 2, 35, 2, 0, 2, 35, -24, 3, 0, 2, 2, 36, 0, 2147549120, 2, 0, 2, 16, 2, 17, 2, 128, 2, 0, 2, 48, 2, 17, 0, 5242879, 3, 0, 2, 0, 402594847, -1, 2, 116, 0, 1090519039, -2, 2, 118, 2, 119, 2, 0, 2, 38, 2, 37, 2, 2, 0, 3766565279, 0, 2039759, -4, 3, 0, 2, 2, 38, -1, 3, 0, 2, 0, 67043519, -5, 2, 0, 0, 4282384383, 0, 1056964609, -1, 3, 0, 2, 0, 67043345, -1, 2, 0, 2, 9, 2, 39, -1, 0, 3825205247, 2, 40, -11, 3, 0, 2, 0, 2147484671, -8, 2, 0, 2, 7, 0, 4294901888, 2, 0, 0, 67108815, -1, 2, 0, 2, 45, -8, 2, 50, 2, 41, 0, 67043329, 2, 122, 2, 42, 0, 8388351, -2, 2, 123, 0, 3028287487, 0, 67043583, -21, 3, 0, 28, 2, 25, -3, 3, 0, 3, 2, 43, 3, 0, 6, 2, 44, -85, 3, 0, 33, 2, 43, -126, 3, 0, 18, 2, 36, -269, 3, 0, 17, 2, 45, 2, 7, 2, 39, -2, 2, 17, 2, 46, 2, 0, 2, 23, 0, 67043343, 2, 126, 2, 27, -27, 3, 0, 2, 0, 4294901791, 2, 7, 2, 187, -2, 0, 3, 3, 0, 191, 2, 47, 3, 0, 23, 2, 35, -296, 3, 0, 8, 2, 7, -2, 2, 17, 3, 0, 11, 2, 6, -72, 3, 0, 3, 2, 127, 0, 1677656575, -166, 0, 4161266656, 0, 4071, 0, 15360, -4, 0, 28, -13, 3, 0, 2, 2, 48, 2, 0, 2, 129, 2, 130, 2, 51, 2, 0, 2, 131, 2, 132, 2, 133, 3, 0, 10, 2, 134, 2, 135, 2, 15, 3, 48, 2, 3, 49, 2, 3, 50, 2, 0, 4294954999, 2, 0, -16, 2, 0, 2, 85, 2, 0, 0, 2105343, 0, 4160749584, 2, 194, -42, 0, 4194303871, 0, 2011, -62, 3, 0, 6, 0, 8323103, -1, 3, 0, 2, 2, 38, -37, 2, 51, 2, 138, 2, 139, 2, 140, 2, 141, 2, 142, -138, 3, 0, 1334, 2, 23, -1, 3, 0, 129, 2, 31, 3, 0, 6, 2, 10, 3, 0, 180, 2, 143, 3, 0, 233, 0, 1, -96, 3, 0, 16, 2, 10, -22583, 3, 0, 7, 2, 27, -6130, 3, 5, 2, -1, 0, 69207040, 3, 41, 2, 3, 0, 14, 2, 52, 2, 53, -3, 0, 3168731136, 0, 4294956864, 2, 1, 2, 0, 2, 54, 3, 0, 4, 0, 4294966275, 3, 0, 4, 2, 55, 2, 56, 2, 4, 2, 26, -1, 2, 17, 2, 57, -1, 2, 0, 2, 19, 0, 4294885376, 3, 0, 2, 0, 3145727, 0, 2617294944, 0, 4294770688, 2, 27, 2, 58, 3, 0, 2, 0, 131135, 2, 91, 0, 70256639, 2, 59, 0, 272, 2, 45, 2, 19, -1, 2, 60, -2, 2, 93, 0, 603979775, 0, 4278255616, 0, 4294836227, 0, 4294549473, 0, 600178175, 0, 2952806400, 0, 268632067, 0, 4294543328, 0, 57540095, 0, 1577058304, 0, 1835008, 0, 4294688736, 2, 61, 2, 62, 0, 33554435, 2, 120, 2, 61, 2, 145, 0, 131075, 0, 3594373096, 0, 67094296, 2, 62, -1, 2, 63, 0, 603979263, 2, 153, 0, 3, 0, 4294828001, 0, 602930687, 2, 175, 0, 393219, 2, 63, 0, 671088639, 0, 2154840064, 0, 4227858435, 0, 4236247008, 2, 64, 2, 36, -1, 2, 4, 0, 917503, 2, 36, -1, 2, 65, 0, 537783470, 0, 4026531935, -1, 0, 1, -1, 2, 34, 2, 47, 0, 7936, -3, 2, 0, 0, 2147485695, 0, 1010761728, 0, 4292984930, 0, 16387, 2, 0, 2, 14, 2, 15, 3, 0, 10, 2, 66, 2, 0, 2, 67, 2, 68, 2, 69, 2, 0, 2, 70, 2, 0, 2, 16, -1, 2, 27, 3, 0, 2, 2, 11, 2, 4, 3, 0, 18, 2, 71, 2, 5, 3, 0, 2, 2, 72, 0, 253951, 3, 20, 2, 0, 122879, 2, 0, 2, 8, 0, 276824064, -2, 3, 0, 2, 2, 9, 2, 0, 0, 4294903295, 2, 0, 2, 18, 2, 7, -1, 2, 17, 2, 46, 2, 0, 2, 73, 2, 39, -1, 2, 23, 2, 0, 2, 31, -2, 0, 128, -2, 2, 74, 2, 8, 0, 4064, -1, 2, 115, 0, 4227907585, 2, 0, 2, 191, 2, 0, 2, 44, 0, 4227915776, 2, 10, 2, 13, -2, 0, 6544896, 3, 0, 6, -2, 3, 0, 8, 2, 11, 2, 0, 2, 75, 2, 10, 2, 0, 2, 76, 2, 77, 2, 78, -3, 2, 79, 2, 12, -3, 2, 80, 2, 81, 2, 82, 2, 0, 2, 13, -83, 2, 0, 2, 49, 2, 7, 3, 0, 4, 0, 817183, 2, 0, 2, 14, 2, 0, 0, 33023, 2, 23, 3, 83, 2, -17, 2, 84, 0, 524157950, 2, 4, 2, 0, 2, 85, 2, 4, 2, 0, 2, 15, 2, 74, 2, 86, 3, 0, 2, 2, 43, 2, 16, -1, 2, 17, -16, 3, 0, 205, 2, 18, -2, 3, 0, 655, 2, 19, 3, 0, 36, 2, 47, -1, 2, 17, 2, 10, 3, 0, 8, 2, 87, 0, 3072, 2, 0, 0, 2147516415, 2, 10, 3, 0, 2, 2, 27, 2, 21, 2, 88, 3, 0, 2, 2, 89, 2, 90, -1, 2, 21, 0, 4294965179, 0, 7, 2, 0, 2, 8, 2, 88, 2, 8, -1, 0, 687603712, 2, 91, 2, 92, 2, 36, 2, 22, 2, 93, 2, 35, 2, 159, 0, 2080440287, 2, 0, 2, 13, 2, 136, 0, 3296722943, 2, 0, 0, 1046675455, 0, 939524101, 0, 1837055, 2, 94, 2, 95, 2, 15, 2, 92, 3, 0, 3, 0, 7, 3, 0, 349, 2, 96, 2, 97, 2, 6, -264, 3, 0, 11, 2, 24, 3, 0, 2, 2, 25, -1, 0, 2700607615, 2, 98, 2, 99, 3, 0, 2, 2, 20, 2, 100, 3, 0, 10, 2, 10, 2, 17, 2, 0, 2, 42, 2, 0, 2, 26, 2, 101, -3, 2, 102, 3, 0, 3, 2, 22, -1, 3, 5, 2, 2, 30, 2, 0, 2, 7, 2, 103, -1, 2, 104, 2, 105, 2, 106, -1, 3, 0, 3, 2, 16, -2, 2, 0, 2, 31, -8, 2, 22, 2, 0, 2, 107, -1, 2, 0, 2, 58, 2, 32, 2, 18, 2, 10, 2, 0, 2, 108, -1, 3, 0, 4, 2, 10, 2, 17, 2, 109, 2, 6, 2, 0, 2, 110, 2, 0, 2, 44, -4, 3, 0, 9, 2, 23, 2, 18, 2, 26, -4, 2, 111, 2, 112, 2, 18, 2, 23, 2, 7, -2, 2, 113, 2, 18, 2, 25, -2, 2, 0, 2, 114, -2, 0, 4277075969, 2, 8, -1, 3, 22, 2, -1, 2, 34, 2, 137, 2, 0, 3, 18, 2, 2, 35, 2, 20, -3, 3, 0, 2, 2, 13, -1, 2, 0, 2, 35, 2, 0, 2, 35, -24, 2, 115, 2, 9, -2, 2, 115, 2, 27, 2, 17, 2, 13, 2, 115, 2, 36, 2, 17, 0, 4718591, 2, 115, 2, 35, 0, 335544350, -1, 2, 116, 2, 117, -2, 2, 118, 2, 119, 2, 7, -1, 2, 120, 2, 61, 0, 3758161920, 0, 3, -4, 2, 0, 2, 31, 2, 170, -1, 2, 0, 2, 27, 0, 176, -5, 2, 0, 2, 43, 2, 177, -1, 2, 0, 2, 27, 2, 189, -1, 2, 0, 2, 19, -2, 2, 25, -12, 3, 0, 2, 2, 121, -8, 0, 4294965249, 0, 67633151, 0, 4026597376, 2, 0, 0, 975, -1, 2, 0, 2, 45, -8, 2, 50, 2, 43, 0, 1, 2, 122, 2, 27, -3, 2, 123, 2, 107, 2, 124, -21, 3, 0, 28, 2, 25, -3, 3, 0, 3, 2, 43, 3, 0, 6, 2, 44, -85, 3, 0, 33, 2, 43, -126, 3, 0, 18, 2, 36, -269, 3, 0, 17, 2, 45, 2, 7, -3, 2, 17, 2, 125, 2, 0, 2, 27, 2, 44, 2, 126, 2, 27, -27, 3, 0, 2, 0, 65567, -1, 2, 100, -2, 0, 3, 3, 0, 191, 2, 47, 3, 0, 23, 2, 35, -296, 3, 0, 8, 2, 7, -2, 2, 17, 3, 0, 11, 2, 6, -72, 3, 0, 3, 2, 127, 2, 128, -187, 3, 0, 2, 2, 48, 2, 0, 2, 129, 2, 130, 2, 51, 2, 0, 2, 131, 2, 132, 2, 133, 3, 0, 10, 2, 134, 2, 135, 2, 15, 3, 48, 2, 3, 49, 2, 3, 50, 2, 2, 136, -129, 3, 0, 6, 2, 137, -1, 3, 0, 2, 2, 44, -37, 2, 51, 2, 138, 2, 139, 2, 140, 2, 141, 2, 142, -138, 3, 0, 1334, 2, 23, -1, 3, 0, 129, 2, 31, 3, 0, 6, 2, 10, 3, 0, 180, 2, 143, 3, 0, 233, 0, 1, -96, 3, 0, 16, 2, 10, -28719, 2, 0, 0, 1, -1, 2, 121, 2, 0, 0, 8193, -21, 0, 50331648, 0, 10255, 0, 4, -11, 2, 62, 2, 163, 0, 1, 0, 71936, -1, 2, 154, 0, 4292933632, 0, 805306431, -5, 2, 144, -1, 2, 172, -1, 0, 6144, -2, 2, 122, -1, 2, 164, -1, 2, 150, 2, 145, 2, 158, 2, 0, 0, 3223322624, 2, 8, 0, 4, -4, 2, 183, 0, 205128192, 0, 1333757536, 0, 3221225520, 0, 423953, 0, 747766272, 0, 2717763192, 0, 4290773055, 0, 278545, 2, 146, 0, 4294886464, 0, 33292336, 0, 417809, 2, 146, 0, 1329579616, 0, 4278190128, 0, 700594195, 0, 1006647527, 0, 4286497336, 0, 4160749631, 2, 147, 0, 469762560, 0, 4171219488, 0, 16711728, 2, 147, 0, 202375680, 0, 3214918176, 0, 4294508592, 2, 147, -1, 0, 983584, 0, 48, 0, 58720275, 0, 3489923072, 0, 10517376, 0, 4293066815, 0, 1, 0, 2013265920, 2, 171, 2, 0, 0, 17816169, 0, 3288339281, 0, 201375904, 2, 0, -2, 0, 256, 0, 122880, 0, 16777216, 2, 144, 0, 4160757760, 2, 0, -6, 2, 160, -11, 0, 3263218176, -1, 0, 49664, 0, 2160197632, 0, 8388802, -1, 0, 12713984, -1, 0, 402653184, 2, 152, 2, 155, -2, 2, 156, -20, 0, 3758096385, -2, 2, 185, 0, 4292878336, 2, 21, 2, 148, 0, 4294057984, -2, 2, 157, 2, 149, 2, 168, -2, 2, 166, -1, 2, 174, -1, 2, 162, 2, 121, 0, 4026593280, 0, 14, 0, 4292919296, -1, 2, 151, 0, 939588608, -1, 0, 805306368, -1, 2, 121, 0, 1610612736, 2, 149, 2, 150, 3, 0, 2, -2, 2, 151, 2, 152, -3, 0, 267386880, -1, 2, 153, 0, 7168, -1, 2, 180, 2, 0, 2, 154, 2, 155, -7, 2, 161, -8, 2, 156, -1, 0, 1426112704, 2, 157, -1, 2, 181, 0, 271581216, 0, 2149777408, 2, 27, 2, 154, 2, 121, 0, 851967, 0, 3758129152, -1, 2, 27, 2, 173, -4, 2, 151, -20, 2, 188, 2, 158, -56, 0, 3145728, 2, 179, 2, 184, 0, 4294443520, 2, 73, -1, 2, 159, 2, 121, -4, 0, 32505856, -1, 2, 160, -1, 0, 2147385088, 2, 21, 1, 2155905152, 2, -3, 2, 91, 2, 0, 2, 161, -2, 2, 148, -6, 2, 162, 0, 4026597375, 0, 1, -1, 0, 1, -1, 2, 163, -3, 2, 137, 2, 190, -2, 2, 159, 2, 164, -1, 2, 169, 2, 121, -6, 2, 121, -213, 2, 162, -657, 2, 158, -36, 2, 165, -1, 0, 65408, -10, 2, 193, -5, 2, 166, -5, 0, 4278222848, 2, 0, 2, 23, -1, 0, 4227919872, -1, 2, 166, -2, 0, 4227874752, 2, 157, -2, 0, 2146435072, 2, 152, -2, 0, 1006649344, 2, 121, -1, 2, 21, 0, 201375744, -3, 0, 134217720, 2, 21, 0, 4286677377, 0, 32896, -1, 2, 167, -3, 2, 168, -349, 2, 169, 2, 170, 2, 171, 3, 0, 264, -11, 2, 172, -2, 2, 155, 2, 0, 0, 520617856, 0, 2692743168, 0, 36, -3, 0, 524284, -11, 2, 27, -1, 2, 178, -1, 2, 176, 0, 3221291007, 2, 155, -1, 0, 524288, 0, 2158720, -3, 2, 152, 0, 1, -4, 2, 121, 0, 3808625411, 0, 3489628288, 0, 4096, 0, 1207959680, 0, 3221274624, 2, 0, -3, 2, 164, 0, 120, 0, 7340032, -2, 0, 4026564608, 2, 4, 2, 27, 2, 157, 3, 0, 4, 2, 152, -1, 2, 173, 2, 171, -1, 0, 8176, 2, 174, 2, 164, 2, 175, -1, 0, 4290773232, 2, 0, -4, 2, 157, 2, 182, 0, 15728640, 2, 171, -1, 2, 154, -1, 0, 4294934512, 3, 0, 4, -9, 2, 21, 2, 162, 2, 176, 3, 0, 4, 0, 704, 0, 1849688064, 0, 4194304, -1, 2, 121, 0, 4294901887, 2, 0, 0, 130547712, 0, 1879048192, 0, 2080374784, 3, 0, 2, -1, 2, 177, 2, 178, -1, 0, 17829776, 0, 2028994560, 0, 4261478144, -2, 2, 0, -1, 0, 4286580608, -1, 0, 29360128, 2, 179, 0, 16252928, 0, 3791388672, 2, 119, 3, 0, 2, -2, 2, 180, 2, 0, -1, 2, 100, -1, 0, 66584576, 3, 0, 11, 2, 121, 3, 0, 12, -2, 0, 245760, 0, 2147418112, -1, 2, 144, 2, 195, 0, 4227923456, -1, 2, 181, 2, 169, 2, 21, -2, 2, 172, 0, 4292870145, 0, 262144, 2, 121, 3, 0, 2, 0, 1073758848, 2, 182, -1, 0, 4227921920, 2, 183, 2, 146, 0, 528402016, 0, 4292927536, 3, 0, 4, -2, 0, 3556769792, 2, 0, -2, 2, 186, 3, 0, 5, -1, 2, 179, 2, 157, 2, 0, -2, 0, 4227923936, 2, 58, -1, 2, 166, 2, 91, 2, 0, 2, 184, 2, 151, 3, 0, 11, -2, 0, 2146959360, 3, 0, 8, -2, 2, 154, -1, 0, 536870960, 2, 115, -1, 2, 185, 3, 0, 8, 0, 512, 0, 8388608, 2, 167, 2, 165, 2, 178, 0, 4286578944, 3, 0, 2, 0, 1152, 0, 1266679808, 2, 186, 3, 0, 21, -28, 2, 155, 3, 0, 3, -3, 0, 4292902912, -6, 2, 93, 3, 0, 85, -33, 2, 187, 3, 0, 126, -18, 2, 188, 3, 0, 269, -17, 2, 185, 2, 121, 0, 4294917120, 3, 0, 2, 2, 27, 0, 4290822144, -2, 0, 67174336, 0, 520093700, 2, 17, 3, 0, 27, -2, 0, 65504, 2, 121, 2, 43, 3, 0, 2, 2, 88, -191, 2, 58, -23, 2, 100, 3, 0, 296, -8, 2, 121, 3, 0, 2, 2, 27, -11, 2, 171, 3, 0, 72, -3, 0, 3758159872, 0, 201391616, 3, 0, 155, -7, 2, 162, -1, 0, 384, -1, 0, 133693440, -3, 2, 180, -2, 2, 30, 3, 0, 5, -2, 2, 21, 2, 122, 3, 0, 4, -2, 2, 181, -1, 2, 144, 0, 335552923, 2, 189, -1, 0, 538974272, 0, 2214592512, 0, 132000, -10, 0, 192, -8, 0, 12288, -21, 0, 134213632, 0, 4294901761, 3, 0, 42, 0, 100663424, 0, 4294965284, 3, 0, 62, -6, 0, 4286578784, 2, 0, -2, 0, 1006696448, 3, 0, 37, 2, 189, 0, 4110942569, 0, 1432950139, 0, 2701658217, 0, 4026532864, 0, 4026532881, 2, 0, 2, 42, 3, 0, 8, -1, 2, 151, -2, 2, 148, 2, 190, 0, 65537, 2, 162, 2, 165, 2, 159, -1, 2, 151, -1, 2, 58, 2, 0, 2, 191, 0, 65528, 2, 171, 0, 4294770176, 2, 30, 3, 0, 4, -30, 2, 192, 0, 4261470208, -3, 2, 148, -2, 2, 192, 2, 0, 2, 151, -1, 2, 186, -1, 2, 154, 0, 4294950912, 3, 0, 2, 2, 151, 2, 121, 2, 165, 2, 193, 2, 166, 2, 0, 2, 194, 2, 188, 3, 0, 48, -1334, 2, 21, 2, 0, -129, 2, 192, -6, 2, 157, -180, 2, 195, -233, 2, 4, 3, 0, 96, -16, 2, 157, 3, 0, 22583, -7, 2, 17, 3, 0, 6128], [4294967295, 4294967291, 4092460543, 4294828015, 4294967294, 134217726, 268435455, 2147483647, 1048575, 16777215, 1073741823, 1061158911, 536805376, 511, 4294910143, 4160749567, 134217727, 4294901760, 4194303, 2047, 262143, 4286578688, 536870911, 8388607, 4294918143, 67108863, 255, 65535, 67043328, 2281701374, 4294967232, 2097151, 4294903807, 4294902783, 4294967039, 524287, 127, 4294549487, 67045375, 1023, 67047423, 4286578687, 4294770687, 32767, 15, 33554431, 2047999, 8191, 4292870143, 4294934527, 4294966783, 4294967279, 262083, 20511, 4290772991, 4294901759, 41943039, 460799, 4294959104, 71303167, 1071644671, 602799615, 65536, 4294828000, 805044223, 4277151126, 1031749119, 4294917631, 2134769663, 4286578493, 4282253311, 4294942719, 33540095, 4294905855, 4294967264, 2868854591, 1608515583, 265232348, 534519807, 2147614720, 1060109444, 4093640016, 17376, 2139062143, 224, 4169138175, 4294868991, 4294909951, 4294967292, 4294965759, 16744447, 4294966272, 4294901823, 4294967280, 8289918, 4294934399, 4294901775, 4294965375, 1602223615, 4294967259, 4294443008, 268369920, 4292804608, 486341884, 4294963199, 3087007615, 1073692671, 131071, 4128527, 4279238655, 4294902015, 4294966591, 2445279231, 3670015, 3238002687, 4294967288, 4294705151, 4095, 3221208447, 4294902271, 4294549472, 2147483648, 4294705152, 4294966143, 64, 16383, 3774873592, 536807423, 67043839, 3758096383, 3959414372, 3755993023, 2080374783, 4294835295, 4294967103, 4160749565, 4087, 31, 184024726, 2862017156, 1593309078, 268434431, 268434414, 4294901763, 536870912, 2952790016, 202506752, 139280, 4293918720, 4227922944, 2147532800, 61440, 3758096384, 117440512, 65280, 4227858432, 3233808384, 3221225472, 4294965248, 32768, 57152, 67108864, 4290772992, 25165824, 4160749568, 57344, 4278190080, 65472, 4227907584, 65520, 1920, 4026531840, 49152, 4294836224, 63488, 1073741824, 4294967040, 251658240, 196608, 12582912, 4294966784, 2097152, 64512, 417808, 469762048, 4261412864, 4227923712, 4294934528, 4294967168, 16, 98304, 63, 4292870144, 4294963200, 65534, 65532]);
function isvalidIdentifierContinue(code) {
    return (convert[(code >>> 5) + 0] >>> code & 31 & 1) !== 0;
}
function isValidIdentifierStart(code) {
    return (convert[(code >>> 5) + 34816] >>> code & 31 & 1) !== 0;
}
function isIdentifierStart(ch) {
    return ch >= 65 /* UpperA */ && ch <= 90 /* UpperZ */ || ch >= 97 /* LowerA */ && ch <= 122 /* LowerZ */ ||
        ch === 36 /* Dollar */ || ch === 95 /* Underscore */ ||
        ch > 127 /* MaxAsciiCharacter */ && isValidIdentifierStart(ch);
}
function isIdentifierPart(ch) {
    return ch >= 65 /* UpperA */ && ch <= 90 /* UpperZ */ || ch >= 97 /* LowerA */ && ch <= 122 /* LowerZ */ ||
        ch >= 48 /* Zero */ && ch <= 57 /* Nine */ || ch === 36 /* Dollar */ || ch === 95 /* Underscore */ ||
        ch > 127 /* MaxAsciiCharacter */ && isvalidIdentifierContinue(ch);
}

var Parser = function Parser(source, options) {
    this.flags = 0 /* None */;
    this.source = source;
    this.index = 0;
    this.column = 0;
    this.line = 1;
    this.endPos = 0;
    this.endColumn = 0;
    this.endLine = 0;
    this.startPos = 0;
    this.startColumn = 0;
    this.startLine = 0;
    this.tokenValue = undefined;
    this.tokenRaw = '';
    this.token = 0;
    this.labelSet = {};
    this.errorLocation = undefined;
    this.tokenRegExp = undefined;
    this.functionScope = undefined;
    this.blockScope = undefined;
    this.parentScope = undefined;
    this.comments = undefined;
    if (options.next)
        { this.flags |= 134217728 /* OptionsNext */; }
    if (options.comments)
        { this.flags |= 268435456 /* OptionsOnComment */; }
    if (options.jsx)
        { this.flags |= 33554432 /* OptionsJSX */; }
    if (options.locations)
        { this.flags |= 8388608 /* OptionsLoc */; }
    if (options.ranges)
        { this.flags |= 4194304 /* OptionsRanges */; }
    if (options.raw)
        { this.flags |= 67108864 /* OptionsRaw */; }
    if (options.v8)
        { this.flags |= 1073741824 /* OptionsV8 */; }
    if (this.flags & 268435456 /* OptionsOnComment */)
        { this.comments = options.comments; }
};
// 'strict' are a pre-set bitmask in 'module code',
// so no need to check for strict directives, and the
// 'body' are different. (thus the duplicate code path).
Parser.prototype.parseModule = function parseModule (context) {
    var node = {
        type: 'Program',
        body: this.ParseModuleItemList(context | 8192 /* AllowIn */),
        sourceType: 'module'
    };
    if (this.flags & 4194304 /* OptionsRanges */) {
        node.start = 0;
        node.end = this.source.length;
    }
    if (this.flags & 8388608 /* OptionsLoc */) {
        node.loc = {
            start: {
                line: 1,
                column: 0,
            },
            end: {
                line: this.line,
                column: this.column
            }
        };
    }
    return node;
};
Parser.prototype.parseScript = function parseScript (context) {
    var node = {
        type: 'Program',
        body: this.parseStatementList(context | 8192 /* AllowIn */),
        sourceType: 'script'
    };
    if (this.flags & 4194304 /* OptionsRanges */) {
        node.start = 0;
        node.end = this.source.length;
    }
    if (this.flags & 8388608 /* OptionsLoc */) {
        node.loc = {
            start: {
                line: 1,
                column: 0,
            },
            end: {
                line: this.line,
                column: this.column
            }
        };
    }
    return node;
};
Parser.prototype.error = function error (type) {
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    throw createError.apply(void 0, [ type, this.trackErrorLocation() ].concat( params ));
};
Parser.prototype.throwError = function throwError (type) {
        var params = [], len = arguments.length - 1;
        while ( len-- > 0 ) params[ len ] = arguments[ len + 1 ];

    throw createError.apply(void 0, [ type, this.errorLocation ].concat( params ));
};
Parser.prototype.trackErrorLocation = function trackErrorLocation () {
    return {
        index: this.index,
        line: this.line,
        column: this.column
    };
};
Parser.prototype.saveState = function saveState () {
    return {
        index: this.index,
        column: this.column,
        line: this.line,
        startLine: this.startLine,
        endLine: this.endLine,
        startColumn: this.startColumn,
        endColumn: this.endColumn,
        token: this.token,
        tokenValue: this.tokenValue,
        tokenRaw: this.tokenRaw,
        startPos: this.startPos,
        endPos: this.endPos,
        tokenRegExp: this.tokenRegExp,
        flags: this.flags,
    };
};
Parser.prototype.rewindState = function rewindState (state) {
    this.index = state.index;
    this.column = state.column;
    this.line = state.line;
    this.token = state.token;
    this.tokenValue = state.tokenValue;
    this.startPos = state.startPos;
    this.endPos = state.endPos;
    this.endLine = state.endLine;
    this.startLine = state.startLine;
    this.startColumn = state.startColumn;
    this.endColumn = state.endColumn;
    this.tokenRegExp = state.tokenRegExp;
    this.tokenRaw = state.tokenRaw;
    this.flags = state.flags;
};
Parser.prototype.nextToken = function nextToken (context) {
    this.token = this.scanToken(context);
    return this.token;
};
Parser.prototype.hasNext = function hasNext () {
    return this.index < this.source.length;
};
Parser.prototype.nextChar = function nextChar () {
    return this.source.charCodeAt(this.index);
};
Parser.prototype.nextUnicodeChar = function nextUnicodeChar () {
    this.advance();
    var hi = this.nextChar();
    if (hi < 0xd800 || hi > 0xdbff)
        { return hi; }
    if (this.index === this.source.length)
        { return hi; }
    var lo = this.nextChar();
    if (lo < 0xdc00 || lo > 0xdfff)
        { return hi; }
    return (hi & 0x3ff) << 10 | lo & 0x3ff | 0x10000;
};
/**
 * Advance to next position
 */
Parser.prototype.advance = function advance () {
    this.index++;
    this.column++;
};
Parser.prototype.advanceTwice = function advanceTwice () {
    this.index += 2;
    this.column += 2;
};
/**
 * Advance to new line
 */
Parser.prototype.advanceNewline = function advanceNewline () {
    this.flags |= 1 /* LineTerminator */;
    this.index++;
    this.column = 0;
    this.line++;
};
/**
 * Advance if the code unit matches the UTF-16 code unit at the given index.
 *
 * @param code Number
 */
Parser.prototype.consume = function consume (code) {
    if (this.nextChar() !== code)
        { return false; }
    this.advance();
    return true;
};
/**
 * Scan the entire source code. Skips whitespace and comments, and
 * return the token at the given index.
 *
 * @param context Context
 */
Parser.prototype.scanToken = function scanToken (context) {
        var this$1 = this;

    this.flags &= ~(1 /* LineTerminator */ | 131072 /* HasUnicode */);
    this.endPos = this.index;
    this.endColumn = this.column;
    this.endLine = this.line;
    while (this.hasNext()) {
        this$1.startPos = this$1.index;
        this$1.startColumn = this$1.column;
        this$1.startLine = this$1.line;
        var first = this$1.nextChar();
        switch (first) {
            case 13 /* CarriageReturn */:
            case 10 /* LineFeed */:
                this$1.advanceNewline();
                if (this$1.hasNext() &&
                    first === 13 /* CarriageReturn */ &&
                    this$1.nextChar() === 10 /* LineFeed */) {
                    this$1.index++;
                }
                continue;
            // 0x7F > chars
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.advanceNewline();
                continue;
            case 9 /* Tab */:
            case 11 /* VerticalTab */:
            case 12 /* FormFeed */:
            case 32 /* Space */:
            case 160 /* NonBreakingSpace */:
            case 5760 /* Ogham */:
            case 8192 /* EnQuad */:
            case 8193 /* EmQuad */:
            case 8194 /* EnSpace */:
            case 8195 /* EmSpace */:
            case 8196 /* ThreePerEmSpace */:
            case 8197 /* FourPerEmSpace */:
            case 8198 /* SixPerEmSpace */:
            case 8199 /* FigureSpace */:
            case 8200 /* PunctuationSpace */:
            case 8201 /* ThinSpace */:
            case 8202 /* HairSpace */:
            case 8239 /* NarrowNoBreakSpace */:
            case 8287 /* MathematicalSpace */:
            case 12288 /* IdeographicSpace */:
            case 65279 /* ZeroWidthNoBreakSpace */:
                this$1.advance();
                continue;
            // `/`, `/=`, `/>`
            case 47 /* Slash */:
                {
                    this$1.advance();
                    var next = this$1.nextChar();
                    if (next === 47 /* Slash */) {
                        this$1.advance();
                        this$1.skipSingleLineComment(2);
                        continue;
                    }
                    else if (next === 42 /* Asterisk */) {
                        this$1.advance();
                        this$1.skipMultiLineComment();
                        continue;
                    }
                    else if (next === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524325 /* DivideAssign */;
                    }
                    return 1051189 /* Divide */;
                }
            // `<`, `<=`, `<<`, `<<=`, `</`,  <!--
            case 60 /* LessThan */:
                {
                    this$1.advance();
                    var next$1 = this$1.nextChar();
                    if (!(context & 1 /* Module */) && next$1 === 33 /* Exclamation */) {
                        this$1.advance();
                        if (this$1.consume(45 /* Hyphen */) &&
                            this$1.consume(45 /* Hyphen */)) {
                            this$1.skipSingleLineComment(4);
                        }
                        continue;
                    }
                    if (next$1 === 60 /* LessThan */) {
                        this$1.advance();
                        if (this$1.consume(61 /* EqualSign */)) {
                            return 524318 /* ShiftLeftAssign */;
                        }
                        return 1050689 /* ShiftLeft */;
                    }
                    if (next$1 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 1050429 /* LessThanOrEqual */;
                    }
                    if (this$1.flags & 33554432 /* OptionsJSX */ &&
                        this$1.consume(47 /* Slash */) &&
                        !this$1.consume(42 /* Asterisk */)) {
                        return 25 /* JSXClose */;
                    }
                    return 1050431 /* LessThan */;
                }
            // -, --, -->, -=,
            case 45 /* Hyphen */:
                {
                    this$1.advance(); // skip '-'
                    var next$2 = this$1.nextChar();
                    if (next$2 === 45 /* Hyphen */) {
                        this$1.advance();
                        if (this$1.consume(62 /* GreaterThan */)) {
                            if (!(context & 1 /* Module */) || this$1.flags & 1 /* LineTerminator */) {
                                this$1.skipSingleLineComment(3);
                            }
                            continue;
                        }
                        return 262172 /* Decrement */;
                    }
                    else if (next$2 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524323 /* SubtractAssign */;
                    }
                    else {
                        return 3148080 /* Subtract */;
                    }
                }
            // `#`
            case 35 /* Hash */:
                {
                    if (this$1.index === 0 &&
                        this$1.source.charCodeAt(this$1.index + 1) === 33 /* Exclamation */) {
                        this$1.advanceTwice();
                        this$1.skipShebangComment();
                        continue;
                    }
                }
            // `{`
            case 123 /* LeftBrace */:
                this$1.advance();
                return 131084 /* LeftBrace */;
            // `}`
            case 125 /* RightBrace */:
                this$1.advance();
                this$1.flags |= 1 /* LineTerminator */;
                return 15 /* RightBrace */;
            // `~`
            case 126 /* Tilde */:
                this$1.advance();
                return 2097198 /* Complement */;
            // `?`
            case 63 /* QuestionMark */:
                this$1.advance();
                return 22 /* QuestionMark */;
            // `[`
            case 91 /* LeftBracket */:
                this$1.advance();
                return 131091 /* LeftBracket */;
            // `]`
            case 93 /* RightBracket */:
                this$1.advance();
                return 20 /* RightBracket */;
            // `,`
            case 44 /* Comma */:
                this$1.advance();
                return 18 /* Comma */;
            // `:`
            case 58 /* Colon */:
                this$1.advance();
                return 21 /* Colon */;
            // `;`
            case 59 /* Semicolon */:
                this$1.advance();
                return 17 /* Semicolon */;
            // `(`
            case 40 /* LeftParen */:
                this$1.advance();
                return 11 /* LeftParen */;
            // `)`
            case 41 /* RightParen */:
                this$1.advance();
                return 16 /* RightParen */;
            // Template
            case 96 /* Backtick */:
                return this$1.scanTemplate(context);
            // `'string'`, `"string"`
            case 34 /* DoubleQuote */:
            case 39 /* SingleQuote */:
                return this$1.scanString(context, first);
            // `&`, `&&`, `&=`
            case 38 /* Ampersand */:
                {
                    this$1.advance();
                    var next$3 = this$1.nextChar();
                    if (next$3 === 38 /* Ampersand */) {
                        this$1.advance();
                        return 1049143 /* LogicalAnd */;
                    }
                    if (next$3 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524329 /* BitwiseAndAssign */;
                    }
                    return 1049924 /* BitwiseAnd */;
                }
            // `%`, `%=`
            case 37 /* Percent */:
                this$1.advance();
                if (!this$1.consume(61 /* EqualSign */))
                    { return 1051188 /* Modulo */; }
                return 524326 /* ModuloAssign */;
            // `!`, `!=`, `!==`
            case 33 /* Exclamation */:
                this$1.advance();
                if (!this$1.consume(61 /* EqualSign */))
                    { return 2097197 /* Negate */; }
                if (!this$1.consume(61 /* EqualSign */))
                    { return 1050172 /* LooseNotEqual */; }
                return 1050170 /* StrictNotEqual */;
            // `^`, `^=`
            case 94 /* Caret */:
                this$1.advance();
                if (!this$1.consume(61 /* EqualSign */))
                    { return 1049670 /* BitwiseXor */; }
                return 524327 /* BitwiseXorAssign */;
            // `*`, `**`, `*=`, `**=`
            case 42 /* Asterisk */:
                {
                    this$1.advance();
                    if (!this$1.hasNext())
                        { return 1051187 /* Multiply */; }
                    var next$4 = this$1.nextChar();
                    if (next$4 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524324 /* MultiplyAssign */;
                    }
                    if (next$4 !== 42 /* Asterisk */)
                        { return 1051187 /* Multiply */; }
                    this$1.advance();
                    if (!this$1.consume(61 /* EqualSign */))
                        { return 1051446 /* Exponentiate */; }
                    return 524321 /* ExponentiateAssign */;
                }
            // `+`, `++`, `+=`
            case 43 /* Plus */:
                {
                    this$1.advance();
                    if (!this$1.hasNext())
                        { return 3148079 /* Add */; }
                    var next$5 = this$1.nextChar();
                    if (next$5 === 43 /* Plus */) {
                        this$1.advance();
                        return 262171 /* Increment */;
                    }
                    if (next$5 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524322 /* AddAssign */;
                    }
                    return 3148079 /* Add */;
                }
            // `=`, `==`, `===`, `=>`
            case 61 /* EqualSign */:
                {
                    this$1.advance();
                    if (!this$1.hasNext())
                        { return 524317 /* Assign */; }
                    var next$6 = this$1.nextChar();
                    if (next$6 === 61 /* EqualSign */) {
                        this$1.advance();
                        if (this$1.consume(61 /* EqualSign */)) {
                            return 1050169 /* StrictEqual */;
                        }
                        else {
                            return 1050171 /* LooseEqual */;
                        }
                    }
                    else if (next$6 === 62 /* GreaterThan */) {
                        this$1.advance();
                        return 10 /* Arrow */;
                    }
                    return 524317 /* Assign */;
                }
            // `>`, `>=`, `>>`, `>>>`, `>>=`, `>>>=`
            case 62 /* GreaterThan */:
                {
                    this$1.advance();
                    // Fixes '<a>= == =</a>'
                    if (context & 16 /* JSXChild */)
                        { return 1050432 /* GreaterThan */; }
                    var next$7 = this$1.nextChar();
                    if (next$7 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 1050430 /* GreaterThanOrEqual */;
                    }
                    if (next$7 !== 62 /* GreaterThan */)
                        { return 1050432 /* GreaterThan */; }
                    this$1.advance();
                    next$7 = this$1.nextChar();
                    if (next$7 === 62 /* GreaterThan */) {
                        this$1.advance();
                        if (this$1.consume(61 /* EqualSign */)) {
                            return 524320 /* LogicalShiftRightAssign */;
                        }
                        else {
                            return 1050691 /* LogicalShiftRight */;
                        }
                    }
                    else if (next$7 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524319 /* ShiftRightAssign */;
                    }
                    return 1050690 /* ShiftRight */;
                }
            // `|`, `||`, `|=`
            case 124 /* VerticalBar */:
                {
                    this$1.advance();
                    var next$8 = this$1.nextChar();
                    if (next$8 === 124 /* VerticalBar */) {
                        this$1.advance();
                        return 1048888 /* LogicalOr */;
                    }
                    else if (next$8 === 61 /* EqualSign */) {
                        this$1.advance();
                        return 524328 /* BitwiseOrAssign */;
                    }
                    return 1049413 /* BitwiseOr */;
                }
            // '.'
            case 46 /* Period */:
                {
                    var index = this$1.index + 1;
                    var next$9 = this$1.source.charCodeAt(index);
                    if (next$9 >= 48 /* Zero */ && next$9 <= 57 /* Nine */) {
                        this$1.scanNumber(context);
                        return 2 /* NumericLiteral */;
                    }
                    else if (next$9 === 46 /* Period */) {
                        index++;
                        if (index < this$1.source.length &&
                            this$1.source.charCodeAt(index) === 46 /* Period */) {
                            this$1.index = index + 1;
                            this$1.column += 3;
                            return 14 /* Ellipsis */;
                        }
                    }
                    this$1.advance();
                    return 13 /* Period */;
                }
            // '0'
            case 48 /* Zero */:
                {
                    var index$1 = this$1.index + 1;
                    if (index$1 + 1 < this$1.source.length) {
                        switch (this$1.source.charCodeAt(index$1)) {
                            case 120 /* LowerX */:
                            case 88 /* UpperX */:
                                return this$1.scanHexadecimalDigit();
                            case 98 /* LowerB */:
                            case 66 /* UpperB */:
                                return this$1.scanBinaryDigits(context);
                            case 111 /* LowerO */:
                            case 79 /* UpperO */:
                                return this$1.scanOctalDigits(context);
                            default: // ignore
                        }
                    }
                    var ch = this$1.source.charCodeAt(index$1);
                    if (index$1 < this$1.source.length && ch >= 48 /* Zero */ && ch <= 55 /* Seven */) {
                        return this$1.scanNumberLiteral(context);
                    }
                }
            // '1' - '9'
            case 49 /* One */:
            case 50 /* Two */:
            case 51 /* Three */:
            case 52 /* Four */:
            case 53 /* Five */:
            case 54 /* Six */:
            case 55 /* Seven */:
            case 56 /* Eight */:
            case 57 /* Nine */:
                return this$1.scanNumber(context);
            // '\uVar', `\u{N}var`
            case 92 /* Backslash */:
            // `A`...`Z`
            case 65 /* UpperA */:
            case 66 /* UpperB */:
            case 67 /* UpperC */:
            case 68 /* UpperD */:
            case 69 /* UpperE */:
            case 70 /* UpperF */:
            case 71 /* UpperG */:
            case 72 /* UpperH */:
            case 73 /* UpperI */:
            case 74 /* UpperJ */:
            case 75 /* UpperK */:
            case 76 /* UpperL */:
            case 77 /* UpperM */:
            case 78 /* UpperN */:
            case 79 /* UpperO */:
            case 80 /* UpperP */:
            case 81 /* UpperQ */:
            case 82 /* UpperR */:
            case 83 /* UpperS */:
            case 84 /* UpperT */:
            case 85 /* UpperU */:
            case 86 /* UpperV */:
            case 87 /* UpperW */:
            case 88 /* UpperX */:
            case 89 /* UpperY */:
            case 90 /* UpperZ */:
            // '$'
            case 36 /* Dollar */:
            // '_'
            case 95 /* Underscore */:
            //  `a`...`z`
            case 97 /* LowerA */:
            case 98 /* LowerB */:
            case 99 /* LowerC */:
            case 100 /* LowerD */:
            case 101 /* LowerE */:
            case 102 /* LowerF */:
            case 103 /* LowerG */:
            case 104 /* LowerH */:
            case 105 /* LowerI */:
            case 106 /* LowerJ */:
            case 107 /* LowerK */:
            case 108 /* LowerL */:
            case 109 /* LowerM */:
            case 110 /* LowerN */:
            case 111 /* LowerO */:
            case 112 /* LowerP */:
            case 113 /* LowerQ */:
            case 114 /* LowerR */:
            case 115 /* LowerS */:
            case 116 /* LowerT */:
            case 117 /* LowerU */:
            case 118 /* LowerV */:
            case 119 /* LowerW */:
            case 120 /* LowerX */:
            case 121 /* LowerY */:
            case 122 /* LowerZ */:
                return this$1.scanIdentifier(context);
            default:
                if (isValidIdentifierStart(first))
                    { return this$1.scanIdentifier(context); }
                this$1.error(0 /* Unexpected */);
        }
    }
    return 0 /* EndOfSource */;
};
Parser.prototype.skipShebangComment = function skipShebangComment () {
        var this$1 = this;

    loop: while (this.hasNext()) {
        switch (this$1.nextChar()) {
            case 10 /* LineFeed */:
            case 13 /* CarriageReturn */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.advanceNewline();
                if (this$1.hasNext() && this$1.nextChar() === 10 /* LineFeed */)
                    { this$1.index++; }
                break loop;
            default:
                this$1.advance();
        }
    }
};
Parser.prototype.skipSingleLineComment = function skipSingleLineComment (offset) {
        var this$1 = this;

    var start = this.index;
    loop: while (this.hasNext()) {
        switch (this$1.nextChar()) {
            case 10 /* LineFeed */:
            case 13 /* CarriageReturn */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.advanceNewline();
                if (this$1.hasNext() && this$1.nextChar() === 10 /* LineFeed */)
                    { this$1.index++; }
                break loop;
            default:
                this$1.advance();
        }
    }
    if (this.flags & 268435456 /* OptionsOnComment */) {
        this.collectComment('SingleLineComment', this.source.slice(start, this.index), this.startPos, this.index);
    }
};
Parser.prototype.skipMultiLineComment = function skipMultiLineComment () {
        var this$1 = this;

    var start = this.index;
    var closed = false;
    loop: while (this.hasNext()) {
        var ch = this$1.nextChar();
        switch (ch) {
            case 42 /* Asterisk */:
                this$1.advance();
                if (this$1.consume(47 /* Slash */)) {
                    closed = true;
                    break loop;
                }
                break;
            case 13 /* CarriageReturn */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
            case 10 /* LineFeed */:
                this$1.advanceNewline();
                if (this$1.hasNext() && this$1.nextChar() === 10 /* LineFeed */)
                    { this$1.index++; }
                break;
            default:
                this$1.advance();
        }
    }
    if (!closed)
        { this.error(2 /* UnterminatedComment */); }
    if (this.flags & 268435456 /* OptionsOnComment */) {
        this.collectComment('MultiLineComment', this.source.slice(start, this.index - 2), this.startPos, this.index);
    }
};
Parser.prototype.collectComment = function collectComment (type, value, start, end, loc) {
        if ( loc === void 0 ) loc = {};

    if (typeof this.comments === 'function') {
        this.comments(type, value, start, end);
    }
    else if (Array.isArray(this.comments)) {
        var node = {
            type: type,
            value: value,
            start: start,
            end: end,
            loc: loc,
        };
        if (this.flags & 4194304 /* OptionsRanges */) {
            node.start = start;
            node.end = end;
        }
        this.comments.push(node);
    }
};
Parser.prototype.scanIdentifier = function scanIdentifier (context) {
        var this$1 = this;

    var start = this.index;
    var ret = '';
    loop: while (this.hasNext()) {
        var code = this$1.nextChar();
        switch (code) {
            case 92 /* Backslash */:
                this$1.flags |= 131072 /* HasUnicode */;
                ret += this$1.source.slice(start, this$1.index);
                ret += fromCodePoint(this$1.peekUnicodeEscape());
                start = this$1.index;
                break;
            default:
                if (code >= 0xd800 && code <= 0xdc00)
                    { code = this$1.nextUnicodeChar(); }
                if (!isIdentifierPart(code))
                    { break loop; }
                this$1.advance();
        }
    }
    if (start < this.index)
        { ret += this.source.slice(start, this.index); }
    var len = ret.length;
    // Invalid: 'function f() { new.t\\u0061rget; }'
    if (this.flags & 131072 /* HasUnicode */ && ret === 'target')
        { this.error(88 /* InvalidEscapedReservedWord */); }
    this.tokenValue = ret;
    // Reserved words are between 2 and 11 characters long and start with a lowercase letter
    if (len >= 2 && len <= 11) {
        var ch = ret.charCodeAt(0);
        if (ch >= 97 /* LowerA */ && ch <= 122 /* LowerZ */) {
            var token = descKeyword(ret);
            if (token > 0) {
                return token;
            }
        }
    }
    return 131073 /* Identifier */;
};
/**
 * Peek unicode escape
 */
Parser.prototype.peekUnicodeEscape = function peekUnicodeEscape () {
    this.advance();
    var code = this.peekExtendedUnicodeEscape();
    if (code >= 0xd800 && code <= 0xdc00)
        { this.error(128 /* UnexpectedSurrogate */); }
    if (!isvalidIdentifierContinue(code))
        { this.error(6 /* InvalidUnicodeEscapeSequence */); }
    this.advance();
    return code;
};
Parser.prototype.scanNumberLiteral = function scanNumberLiteral (context) {
        var this$1 = this;

    if (context & 2 /* Strict */)
        { this.error(7 /* StrictOctalEscape */); }
    if (!(this.flags & 262144 /* Noctal */))
        { this.flags |= 262144 /* Noctal */; }
    this.advance();
    var ch = this.nextChar();
    var code = 0;
    var isDecimal = false;
    while (this.hasNext()) {
        ch = this$1.nextChar();
        if (!isDecimal && ch >= 56 /* Eight */)
            { isDecimal = true; }
        if (!(48 /* Zero */ <= ch && ch <= 57 /* Nine */))
            { break; }
        code = code * 8 + (ch - 48);
        this$1.advance();
    }
    if (this.flags & 134217728 /* OptionsNext */ && this.consume(110 /* LowerN */))
        { this.flags |= 524288 /* BigInt */; }
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(this.startPos, this.index); }
    this.tokenValue = isDecimal ? parseInt(this.source.slice(this.startPos, this.index), 10) : code;
    return 2 /* NumericLiteral */;
};
Parser.prototype.scanOctalDigits = function scanOctalDigits (context) {
        var this$1 = this;

    if (context & 2 /* Strict */)
        { this.error(7 /* StrictOctalEscape */); }
    this.advanceTwice();
    var ch = this.nextChar();
    var code = ch - 48;
    // we must have at least one octal digit after 'o'/'O'
    if (ch < 48 /* Zero */ || ch >= 56 /* Eight */)
        { this.error(50 /* InvalidBinaryDigit */); }
    this.advance();
    while (this.hasNext()) {
        ch = this$1.nextChar();
        if (!(48 /* Zero */ <= ch && ch <= 55 /* Seven */))
            { break; }
        if (ch < 48 /* Zero */ || ch >= 56 /* Eight */)
            { this$1.error(50 /* InvalidBinaryDigit */); }
        code = (code << 3) | (ch - 48 /* Zero */);
        this$1.advance();
    }
    this.tokenValue = code;
    if (this.flags & 134217728 /* OptionsNext */ && this.consume(110 /* LowerN */))
        { this.flags |= 524288 /* BigInt */; }
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(this.startPos, this.index); }
    return 2 /* NumericLiteral */;
};
Parser.prototype.scanHexadecimalDigit = function scanHexadecimalDigit () {
        var this$1 = this;

    this.advanceTwice();
    var ch = this.nextChar();
    var code = toHex(ch);
    if (code < 0)
        { this.error(125 /* InvalidRadix */); }
    this.advance();
    while (this.hasNext()) {
        ch = this$1.nextChar();
        var digit = toHex(ch);
        if (digit < 0)
            { break; }
        code = code << 4 | digit;
        this$1.advance();
    }
    this.tokenValue = code;
    if (this.flags & 134217728 /* OptionsNext */ && this.consume(110 /* LowerN */))
        { this.flags |= 524288 /* BigInt */; }
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(this.startPos, this.index); }
    return 2 /* NumericLiteral */;
};
Parser.prototype.scanBinaryDigits = function scanBinaryDigits (context) {
        var this$1 = this;

    this.advanceTwice();
    var ch = this.nextChar();
    var code = ch - 48;
    // Invalid:  '0b'
    if (ch !== 48 /* Zero */ && ch !== 49 /* One */) {
        this.error(50 /* InvalidBinaryDigit */);
    }
    this.advance();
    while (this.hasNext()) {
        ch = this$1.nextChar();
        if (!(ch === 48 /* Zero */ || ch === 49 /* One */))
            { break; }
        code = (code << 1) | (ch - 48 /* Zero */);
        this$1.advance();
    }
    this.tokenValue = code;
    if (this.flags & 134217728 /* OptionsNext */ && this.consume(110 /* LowerN */))
        { this.flags |= 524288 /* BigInt */; }
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(this.startPos, this.index); }
    return 2 /* NumericLiteral */;
};
Parser.prototype.skipDigits = function skipDigits () {
        var this$1 = this;

    scan: while (this.hasNext()) {
        switch (this$1.nextChar()) {
            case 48 /* Zero */:
            case 49 /* One */:
            case 50 /* Two */:
            case 51 /* Three */:
            case 52 /* Four */:
            case 53 /* Five */:
            case 54 /* Six */:
            case 55 /* Seven */:
            case 56 /* Eight */:
            case 57 /* Nine */:
                this$1.advance();
                break;
            default:
                break scan;
        }
    }
};
Parser.prototype.scanNumber = function scanNumber (context) {
    var start = this.index;
    this.skipDigits();
    if (this.nextChar() === 46 /* Period */) {
        if (!(this.flags & 1048576 /* Float */))
            { this.flags |= 1048576 /* Float */; }
        this.advance();
        this.skipDigits();
    }
    var end = this.index;
    switch (this.nextChar()) {
        // scan exponent, if any
        case 69 /* UpperE */:
        case 101 /* LowerE */:
            this.advance();
            if (!(this.flags & 2097152 /* Exponent */))
                { this.flags |= 2097152 /* Exponent */; }
            // scan exponent
            switch (this.nextChar()) {
                case 43 /* Plus */:
                case 45 /* Hyphen */:
                    this.advance();
                    if (!this.hasNext())
                        { this.error(126 /* UnexpectedTokenNumber */); }
                default: // ignore
            }
            switch (this.nextChar()) {
                case 48 /* Zero */:
                case 49 /* One */:
                case 50 /* Two */:
                case 51 /* Three */:
                case 52 /* Four */:
                case 53 /* Five */:
                case 54 /* Six */:
                case 55 /* Seven */:
                case 56 /* Eight */:
                case 57 /* Nine */:
                    this.advance();
                    this.skipDigits();
                    break;
                default:
                    // we must have at least one decimal digit after 'e'/'E'
                    this.error(127 /* UnexpectedMantissa */);
            }
            end = this.index;
            break;
        // BigInt - Stage 3 proposal
        case 110 /* LowerN */:
            if (this.flags & 134217728 /* OptionsNext */) {
                if (this.flags & 1048576 /* Float */)
                    { this.error(0 /* Unexpected */); }
                this.advance();
                if (!(this.flags & 524288 /* BigInt */))
                    { this.flags |= 524288 /* BigInt */; }
                end = this.index;
            }
        default: // ignore
    }
    // The source character immediately following a numeric literal must
    // not be an identifier start or a decimal digit.
    if (isIdentifierStart(this.nextChar()))
        { this.error(126 /* UnexpectedTokenNumber */); }
    var raw = this.source.substring(start, end);
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = raw; }
    this.tokenValue = this.flags & 3145728 /* FloatOrExponent */ ? parseFloat(raw) : parseInt(raw, 10);
    return 2 /* NumericLiteral */;
};
Parser.prototype.scanRegularExpression = function scanRegularExpression () {
        var this$1 = this;

    var index = this.startPos + 1;
    var bodyStart = index;
    var preparseState = 0;
    loop: while (true) {
        var ch = this$1.source.charCodeAt(index);
        index++;
        this$1.column++;
        if (preparseState & 1 /* Escape */) {
            preparseState &= ~1 /* Escape */;
        }
        else {
            switch (ch) {
                case 47 /* Slash */:
                    if (!preparseState)
                        { break loop; }
                    break;
                case 92 /* Backslash */:
                    preparseState |= 1 /* Escape */;
                    break;
                case 91 /* LeftBracket */:
                    preparseState |= 2 /* Class */;
                    break;
                case 93 /* RightBracket */:
                    preparseState &= 1 /* Escape */;
                    break;
                case 13 /* CarriageReturn */:
                case 10 /* LineFeed */:
                case 8232 /* LineSeparator */:
                case 8233 /* ParagraphSeparator */:
                    this$1.index = index;
                    return this$1.token;
                default: // ignore
            }
        }
        if (index >= this$1.source.length)
            { this$1.error(4 /* UnterminatedRegExp */); }
    }
    var bodyEnd = index - 1; // drop the slash from the slice
    var flagsStart = index;
    var mask = 0;
    loop: while (index < this.source.length) {
        var code = this$1.source.charCodeAt(index);
        switch (code) {
            case 103 /* LowerG */:
                if (mask & 1 /* Global */)
                    { this$1.error(11 /* DuplicateRegExpFlag */, 'g'); }
                mask |= 1 /* Global */;
                break;
            case 105 /* LowerI */:
                if (mask & 16 /* IgnoreCase */)
                    { this$1.error(11 /* DuplicateRegExpFlag */, 'i'); }
                mask |= 16 /* IgnoreCase */;
                break;
            case 109 /* LowerM */:
                if (mask & 8 /* Multiline */)
                    { this$1.error(11 /* DuplicateRegExpFlag */, 'm'); }
                mask |= 8 /* Multiline */;
                break;
            case 117 /* LowerU */:
                if (mask & 2 /* Unicode */)
                    { this$1.error(11 /* DuplicateRegExpFlag */, 'u'); }
                mask |= 2 /* Unicode */;
                break;
            case 121 /* LowerY */:
                if (mask & 4 /* Sticky */)
                    { this$1.error(11 /* DuplicateRegExpFlag */, 'y'); }
                mask |= 4 /* Sticky */;
                break;
            // Stage 3 proposal
            case 115 /* LowerS */:
                if (this$1.flags & 134217728 /* OptionsNext */) {
                    if (mask & 32 /* DotAll */)
                        { this$1.error(11 /* DuplicateRegExpFlag */, 's'); }
                    mask |= 32 /* DotAll */;
                    break;
                }
            default:
                if (code >= 0xd800 && code <= 0xdc00)
                    { code = this$1.nextUnicodeChar(); }
                if (!isIdentifierPart(code))
                    { break loop; }
                this$1.error(13 /* UnexpectedTokenRegExpFlag */);
        }
        index++;
        this$1.column++;
    }
    this.endPos = this.index;
    this.index = index;
    var pattern = this.source.slice(bodyStart, bodyEnd);
    var flags = this.source.slice(flagsStart, this.index);
    this.tokenRegExp = {
        pattern: pattern,
        flags: flags
    };
    this.tokenValue = tryCreate(pattern, flags);
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(this.startPos, this.index); }
    return 4 /* RegularExpression */;
};
Parser.prototype.scanString = function scanString (context, quote) {
        var this$1 = this;

    var rawStart = this.index;
    this.advance();
    if (!this.hasNext())
        { this.error(3 /* UnterminatedString */); }
    var ret = '';
    var start = this.index;
    var ch;
    while (this.hasNext()) {
        ch = this$1.nextChar();
        if (ch === quote)
            { break; }
        switch (ch) {
            case 92 /* Backslash */:
                ret += this$1.source.slice(start, this$1.index);
                ret += this$1.scanStringEscape(context);
                this$1.advance();
                start = this$1.index;
                continue;
            case 13 /* CarriageReturn */:
            case 10 /* LineFeed */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.error(3 /* UnterminatedString */);
            default: // ignore
        }
        this$1.advance();
    }
    if (start !== this.index)
        { ret += this.source.slice(start, this.index); }
    if (ch !== quote)
        { this.error(3 /* UnterminatedString */); }
    this.advance(); // skip the quote
    this.tokenValue = ret;
    // raw
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(rawStart, this.index); }
    return 3 /* StringLiteral */;
};
Parser.prototype.peekExtendedUnicodeEscape = function peekExtendedUnicodeEscape () {
        var this$1 = this;

    this.advance(); // 'u'
    if (!this.hasNext())
        { this.error(74 /* InvalidHexEscapeSequence */); }
    var ch = this.nextChar();
    // '\u{DDDDDDDD}'
    if (ch === 123 /* LeftBrace */) {
        var code = 0;
        this.advance();
        if (!this.hasNext())
            { this.error(74 /* InvalidHexEscapeSequence */); }
        ch = this.nextChar();
        // At least, one hex digit is required.
        if (ch === 125 /* RightBrace */)
            { this.error(74 /* InvalidHexEscapeSequence */); }
        while (ch !== 125 /* RightBrace */) {
            var digit = toHex(ch);
            if (digit < 0)
                { this$1.error(74 /* InvalidHexEscapeSequence */); }
            code = (code << 4) | digit;
            if (code > 1114111 /* LastUnicodeChar */)
                { this$1.error(5 /* UnicodeOutOfRange */); }
            this$1.advance();
            // At least one digit is expected
            if (!this$1.hasNext())
                { this$1.error(74 /* InvalidHexEscapeSequence */); }
            ch = this$1.nextChar();
        }
        if (ch !== 125 /* RightBrace */)
            { this.error(74 /* InvalidHexEscapeSequence */); }
        return code;
        // '\uDDDD'
    }
    else if (this.index + 3 < this.source.length) {
        var code$1 = toHex(ch);
        if (code$1 < 0)
            { this.error(74 /* InvalidHexEscapeSequence */); }
        for (var i = 0; i < 3; i++) {
            this$1.advance();
            if (!this$1.hasNext())
                { this$1.error(74 /* InvalidHexEscapeSequence */); }
            ch = this$1.nextChar();
            var digit$1 = toHex(ch);
            if (code$1 < 0)
                { this$1.error(74 /* InvalidHexEscapeSequence */); }
            code$1 = code$1 << 4 | digit$1;
        }
        // Invalid:  "'foo\u000u bar'", "'foo\u000U bar'"
        switch (ch) {
            case 117 /* LowerU */:
            case 85 /* UpperU */:
            case 85 /* UpperU */:
                this.error(74 /* InvalidHexEscapeSequence */);
            default: // ignore
        }
        return code$1;
    }
    this.error(6 /* InvalidUnicodeEscapeSequence */);
};
Parser.prototype.scanStringEscape = function scanStringEscape (context) {
    this.advance();
    if (!this.hasNext)
        { this.error(6 /* InvalidUnicodeEscapeSequence */); }
    var cp = this.nextChar();
    switch (cp) {
        case 98 /* LowerB */:
            return '\b';
        case 116 /* LowerT */:
            return '\t';
        case 110 /* LowerN */:
            return '\n';
        case 118 /* LowerV */:
            return '\v';
        case 102 /* LowerF */:
            return '\f';
        case 114 /* LowerR */:
            return '\r';
        case 92 /* Backslash */:
            return '\\';
        case 39 /* SingleQuote */:
            return '\'';
        case 34 /* DoubleQuote */:
            return '\"';
        // Unicode character specification.
        case 117 /* LowerU */:
            return fromCodePoint(this.peekExtendedUnicodeEscape());
        // Hexadecimal character specification.
        case 120 /* LowerX */:
            {
                this.advance();
                var ch = this.nextChar();
                if (!this.hasNext())
                    { this.error(3 /* UnterminatedString */); }
                var ch1 = this.nextChar();
                var hi = toHex(ch1);
                if (hi < 0)
                    { this.error(74 /* InvalidHexEscapeSequence */); }
                this.advance();
                if (!this.hasNext())
                    { this.error(3 /* UnterminatedString */); }
                var ch2 = this.nextChar();
                var lo = toHex(ch2);
                if (lo < 0)
                    { this.error(74 /* InvalidHexEscapeSequence */); }
                return fromCodePoint(hi << 4 | lo);
            }
        // Octal character specification.
        case 48 /* Zero */:
        // falls through
        case 49 /* One */:
        // falls through
        case 50 /* Two */:
        // falls through
        case 51 /* Three */:
            {
                var code = cp - 48;
                var index = this.index + 1;
                var column = this.column + 1;
                if (index < this.source.length) {
                    var next = this.source.charCodeAt(index);
                    if (next < 48 /* Zero */ || next > 55 /* Seven */) {
                        if (code !== 0 && context & 2 /* Strict */)
                            { this.error(9 /* StrictOctalLiteral */); }
                    }
                    else if (context & 2 /* Strict */) {
                        this.error(9 /* StrictOctalLiteral */);
                    }
                    else {
                        code = (code << 3) | (next - 48 /* Zero */);
                        index++;
                        column++;
                        if (index < this.source.length) {
                            next = this.source.charCodeAt(index);
                            if (next >= 48 /* Zero */ && next <= 55 /* Seven */) {
                                code = (code << 3) | (next - 48 /* Zero */);
                                index++;
                                column++;
                            }
                        }
                        this.index = index - 1;
                        this.column = column - 1;
                    }
                }
                return String.fromCharCode(code);
            }
        case 52 /* Four */:
        // falls through
        case 53 /* Five */:
        // falls through
        case 54 /* Six */:
        // falls through
        case 55 /* Seven */:
            {
                if (context & 2 /* Strict */)
                    { this.error(7 /* StrictOctalEscape */); }
                var code$1 = cp - 48;
                var index$1 = this.index + 1;
                var column$1 = this.column + 1;
                if (index$1 < this.source.length) {
                    var next$1 = this.source.charCodeAt(index$1);
                    if (next$1 >= 48 /* Zero */ && next$1 <= 55 /* Seven */) {
                        code$1 = (code$1 << 3) | (next$1 - 48 /* Zero */);
                        this.index = index$1;
                        this.column = column$1;
                    }
                }
                return String.fromCharCode(code$1);
            }
        case 56 /* Eight */:
        // falls through
        case 57 /* Nine */:
            this.error(8 /* InvalidEightAndNine */);
        case 13 /* CarriageReturn */:
            // Allow escaped CR+LF newlines in multiline string literals.
            if (this.hasNext() && this.nextChar() === 10 /* LineFeed */)
                { this.advance(); }
        case 10 /* LineFeed */:
        case 8232 /* LineSeparator */:
        case 8233 /* ParagraphSeparator */:
            this.column = -1;
            this.line++;
            return '';
        default:
            // Other escaped characters are interpreted as their non-escaped version.
            return this.source.charAt(cp);
    }
};
Parser.prototype.scanJSXIdentifier = function scanJSXIdentifier (context) {
        var this$1 = this;

    switch (this.token) {
        case 131073 /* Identifier */:
            var firstCharPosition = this.index;
            scan: while (this.hasNext()) {
                var ch = this$1.nextChar();
                switch (ch) {
                    case 45 /* Hyphen */:
                        this$1.advance();
                        break;
                    default:
                        if ((firstCharPosition === this$1.index) ? isIdentifierStart(ch) : isIdentifierPart(ch)) {
                            this$1.advance();
                        }
                        else {
                            break scan;
                        }
                }
            }
            this.tokenValue += this.source.slice(firstCharPosition, this.index - firstCharPosition);
        default:
            return this.token;
    }
};
Parser.prototype.scanTemplateNext = function scanTemplateNext (context) {
    if (!this.hasNext())
        { this.error(0 /* Unexpected */); }
    this.index--;
    this.column--;
    return this.scanTemplate(context);
};
Parser.prototype.scanTemplate = function scanTemplate (context) {
        var this$1 = this;

    var start = this.index;
    var tail = true;
    var ret = '';
    this.advance();
    if (!this.hasNext())
        { this.error(106 /* UnterminatedTemplate */); }
    var ch = this.nextChar();
    loop: while (ch !== 96 /* Backtick */) {
        switch (ch) {
            case 36 /* Dollar */:
                {
                    var index = this$1.index + 1;
                    if (index < this$1.source.length &&
                        this$1.source.charCodeAt(index) === 123 /* LeftBrace */) {
                        this$1.index = index;
                        this$1.column++;
                        tail = false;
                        break loop;
                    }
                    ret += '$';
                    break;
                }
            case 92 /* Backslash */:
                this$1.advance();
                if (!this$1.hasNext())
                    { this$1.error(106 /* UnterminatedTemplate */); }
                if (ch >= 128) {
                    ret += fromCodePoint(ch);
                }
                else {
                    ret += this$1.scanStringEscape(context);
                }
                break;
            case 13 /* CarriageReturn */:
                if (this$1.hasNext() && this$1.nextChar() === 10 /* LineFeed */) {
                    if (ret != null)
                        { ret += fromCodePoint(ch); }
                    ch = this$1.nextChar();
                    this$1.index++;
                }
            case 10 /* LineFeed */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.column = -1;
                this$1.line++;
            default:
                if (ret != null)
                    { ret += fromCodePoint(ch); }
        }
        this$1.advance();
        if (!this$1.hasNext())
            { this$1.error(106 /* UnterminatedTemplate */); }
        ch = this$1.nextChar();
    }
    this.advance();
    this.tokenValue = ret;
    if (tail) {
        this.tokenRaw = this.source.slice(start + 1, this.index - 1);
        return 9 /* TemplateTail */;
    }
    else {
        this.tokenRaw = this.source.slice(start + 1, this.index - 2);
        return 8 /* TemplateCont */;
    }
};
Parser.prototype.ParseModuleItemList = function ParseModuleItemList (context) {
        var this$1 = this;

    // ecma262/#prod-Module
    // Module :
    //ModuleBody?
    //
    // ecma262/#prod-ModuleItemList
    // ModuleBody :
    //   ModuleItem*
    var pos = this.getLocations();
    this.nextToken(context);
    var statements = [];
    while (this.token !== 0 /* EndOfSource */) {
        statements.push(this$1.parseModuleItem(context));
    }
    return statements;
};
Parser.prototype.parseStatementList = function parseStatementList (context) {
        var this$1 = this;

    this.nextToken(context);
    var statements = [];
    while (this.token !== 0 /* EndOfSource */) {
        if (!(this$1.token & 3 /* StringLiteral */))
            { break; }
        var item = this$1.parseStatementListItem(context);
        statements.push(item);
        if (!isDirective(item))
            { break; }
        if (item.expression.value === 'use strict') {
            context |= 2 /* Strict */;
            break;
        }
    }
    while (this.token !== 0 /* EndOfSource */) {
        statements.push(this$1.parseStatementListItem(context));
    }
    return statements;
};
Parser.prototype.getLocations = function getLocations () {
    return {
        start: this.startPos,
        line: this.startLine,
        column: this.startColumn
    };
};
Parser.prototype.finishNode = function finishNode (loc, node) {
    if (this.flags & 4194304 /* OptionsRanges */) {
        node.start = loc.start;
        node.end = this.endPos;
    }
    if (this.flags & 8388608 /* OptionsLoc */) {
        node.loc = {
            start: {
                line: loc.line,
                column: loc.column,
            },
            end: {
                line: this.endLine,
                column: this.endColumn
            }
        };
    }
    return node;
};
Parser.prototype.finishNodeAt = function finishNodeAt (start, end, node) {
    if (this.flags & 4194304 /* OptionsRanges */) {
        node.start = start;
        node.end = end;
    }
    if (this.flags & 8388608 /* OptionsLoc */) {
        node.loc = {
            start: {
                line: this.startLine,
                column: this.startColumn,
            },
            end: {
                line: this.endLine,
                column: this.endColumn
            }
        };
    }
    return node;
};
Parser.prototype.parseOptional = function parseOptional (context, t) {
    if (this.token !== t)
        { return false; }
    this.nextToken(context);
    return true;
};
Parser.prototype.expect = function expect (context, t) {
    if (this.token !== t)
        { this.error(0 /* Unexpected */); }
    this.nextToken(context);
};
Parser.prototype.isEvalOrArguments = function isEvalOrArguments (value) {
    return value === 'eval' || value === 'arguments';
};
Parser.prototype.canConsumeSemicolon = function canConsumeSemicolon () {
    // Bail out quickly if we have seen a LineTerminator
    if (this.flags & 1 /* LineTerminator */)
        { return true; }
    switch (this.token) {
        case 17 /* Semicolon */:
        case 15 /* RightBrace */:
        case 0 /* EndOfSource */:
            return true;
        default:
            return false;
    }
};
/**
 * Consume a semicolon between tokens, optionally inserting it if necessary.
 */
Parser.prototype.consumeSemicolon = function consumeSemicolon (context) {
    if (!this.canConsumeSemicolon())
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    if (this.token === 17 /* Semicolon */)
        { this.expect(context, 17 /* Semicolon */); }
};
Parser.prototype.isIdentifier = function isIdentifier (context, t) {
    if (context & 1 /* Module */) {
        switch (t) {
            case 20586 /* YieldKeyword */:
            case 2162797 /* AwaitKeyword */:
            case 65644 /* AsyncKeyword */:
                this.error(103 /* UnexpectedReservedWord */);
            default:
                if ((t & 20480 /* FutureReserved */) === 20480 /* FutureReserved */)
                    { this.error(108 /* UnexpectedStrictReserved */); }
        }
        return (t & 131073 /* Identifier */) === 131073 /* Identifier */ || (t & 65536 /* Contextual */) === 65536 /* Contextual */;
    }
    if (context & 2 /* Strict */) {
        switch (t) {
            case 20586 /* YieldKeyword */:
                if (context & 4096 /* Yield */)
                    { this.error(113 /* DisallowedInContext */, tokenDesc(t)); }
                break;
            default:
                if ((t & 20480 /* FutureReserved */) === 20480 /* FutureReserved */)
                    { this.error(108 /* UnexpectedStrictReserved */); }
        }
        return (t & 131073 /* Identifier */) === 131073 /* Identifier */ || (t & 65536 /* Contextual */) === 65536 /* Contextual */;
    }
    switch (t) {
        case 65644 /* AsyncKeyword */:
            if (context & 2048 /* Await */)
                { this.error(103 /* UnexpectedReservedWord */); }
            break;
        default: // ignore
    }
    return (t & 131073 /* Identifier */) === 131073 /* Identifier */ || (t & 65536 /* Contextual */) === 65536 /* Contextual */ || (t & 20480 /* FutureReserved */) === 20480 /* FutureReserved */;
};
Parser.prototype.nextTokenIsLeftParen = function nextTokenIsLeftParen (context) {
    var savedState = this.saveState();
    this.nextToken(context);
    var next = this.token;
    this.rewindState(savedState);
    return next === 11 /* LeftParen */;
};
Parser.prototype.isLexical = function isLexical (context) {
    // In ES6 'let' always starts a lexical declaration if followed by an identifier or {
    // or [.
    var savedState = this.saveState();
    this.nextToken(context);
    var next = this.token;
    this.rewindState(savedState);
    return hasMask(next, 131072 /* BindingPattern */);
};
Parser.prototype.parseExportDefault = function parseExportDefault (context, pos) {
    //  Supports the following productions, starting after the 'default' token:
    //'export' 'default' HoistableDeclaration
    //'export' 'default' ClassDeclaration
    //'export' 'default' AssignmentExpression[In] ';'
    this.expect(context, 12368 /* DefaultKeyword */);
    var declaration;
    switch (this.token) {
        // export default HoistableDeclaration[Default]
        case 12375 /* FunctionKeyword */:
            declaration = this.parseFunctionDeclaration(context |= (65536 /* OptionalIdentifier */ | 33554432 /* Export */));
            break;
        // export default ClassDeclaration[Default]
        case 12365 /* ClassKeyword */:
            declaration = this.parseClassDeclaration(context | (65536 /* OptionalIdentifier */ | 33554432 /* Export */));
            break;
        // export default HoistableDeclaration[Default]
        case 65644 /* AsyncKeyword */:
            if (this.nextTokenIsFunctionKeyword(context)) {
                declaration = this.parseFunctionDeclaration(context | 33554432 /* Export */);
                break;
            }
        /* falls through */
        default:
            // export default [lookahead ∉ {function, class}] AssignmentExpression[In] ;
            declaration = this.parseAssignmentExpression(context);
            this.consumeSemicolon(context);
    }
    return this.finishNode(pos, {
        type: 'ExportDefaultDeclaration',
        declaration: declaration
    });
};
Parser.prototype.parseExportDeclaration = function parseExportDeclaration (context) {
        var this$1 = this;

    // ExportDeclaration:
    //'export' '*' 'from' ModuleSpecifier ';'
    //'export' ExportClause ('from' ModuleSpecifier)? ';'
    //'export' VariableStatement
    //'export' Declaration
    //'export' 'default' ... (handled in ParseExportDefault)
    if (this.flags & 4 /* InFunctionBody */)
        { this.error(57 /* ExportDeclAtTopLevel */); }
    var pos = this.getLocations();
    var specifiers = [];
    var source = null;
    var isExportFromIdentifier = false;
    var declaration = null;
    this.expect(context, 12371 /* ExportKeyword */);
    switch (this.token) {
        case 12368 /* DefaultKeyword */:
            return this.parseExportDefault(context, pos);
        // export * FromClause ;
        case 1051187 /* Multiply */:
            return this.parseExportAllDeclaration(context, pos);
        case 131084 /* LeftBrace */:
            // There are two cases here:
            //
            // 'export' ExportClause ';'
            // and
            // 'export' ExportClause FromClause ';'
            //
            // In the first case, the exported identifiers in ExportClause must
            // not be reserved words, while in the latter they may be. We
            // pass in a location that gets filled with the first reserved word
            // encountered, and then throw a SyntaxError if we are in the
            // non-FromClause case.
            this.expect(context, 131084 /* LeftBrace */);
            while (!this.parseOptional(context, 15 /* RightBrace */)) {
                if (this$1.token === 12368 /* DefaultKeyword */)
                    { isExportFromIdentifier = true; }
                specifiers.push(this$1.parseExportSpecifier(context));
                // Invalid: 'export {a,,b}'
                if (this$1.token !== 15 /* RightBrace */)
                    { this$1.expect(context, 18 /* Comma */); }
            }
            if (this.parseOptional(context, 65649 /* FromKeyword */)) {
                // export {default} from 'foo';
                // export {foo} from 'foo';
                source = this.parseModuleSpecifier(context);
            }
            else if (isExportFromIdentifier)
                { this.error(0 /* Unexpected */); }
            this.consumeSemicolon(context);
            break;
        // export ClassDeclaration
        case 12365 /* ClassKeyword */:
            declaration = this.parseClassDeclaration(context | 33554432 /* Export */);
            break;
        // export LexicalDeclaration
        case 4206665 /* ConstKeyword */:
            declaration = this.parseVariableStatement(context |= (67108864 /* Const */ | 16777216 /* RequireInitializer */));
            break;
        // export LexicalDeclaration
        case 4214856 /* LetKeyword */:
            declaration = this.parseVariableStatement(context |= (134217728 /* Let */ | 16777216 /* RequireInitializer */));
            break;
        // export VariableDeclaration
        case 4206663 /* VarKeyword */:
            declaration = this.parseVariableStatement(context | 16777216 /* RequireInitializer */ | 33554432 /* Export */);
            break;
        // export HoistableDeclaration
        case 12375 /* FunctionKeyword */:
            declaration = this.parseFunctionDeclaration(context | 33554432 /* Export */);
            break;
        // export HoistableDeclaration
        case 65644 /* AsyncKeyword */:
            if (this.nextTokenIsFunctionKeyword(context)) {
                declaration = this.parseFunctionDeclaration(context | 33554432 /* Export */);
                break;
            }
        default:
            this.error(59 /* MissingMsgDeclarationAfterExport */);
    }
    return this.finishNode(pos, {
        type: 'ExportNamedDeclaration',
        source: source,
        specifiers: specifiers,
        declaration: declaration
    });
};
Parser.prototype.parseExportSpecifier = function parseExportSpecifier (context) {
    var pos = this.getLocations();
    var local = this.parseIdentifier(context);
    var exported = local;
    if (this.parseOptional(context, 65643 /* AsKeyword */)) {
        // Invalid: 'export { x as arguments };'
        // Invalid: 'export { x as eval };'
        if (this.isEvalOrArguments(this.tokenValue))
            { this.error(103 /* UnexpectedReservedWord */); }
        exported = this.parseIdentifier(context);
    }
    return this.finishNode(pos, {
        type: 'ExportSpecifier',
        local: local,
        exported: exported
    });
};
Parser.prototype.parseExportAllDeclaration = function parseExportAllDeclaration (context, pos) {
    this.expect(context, 1051187 /* Multiply */);
    this.expect(context, 65649 /* FromKeyword */);
    // Invalid `export * from 123;`
    if (this.token !== 3 /* StringLiteral */)
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    var source = this.parseModuleSpecifier(context);
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'ExportAllDeclaration',
        source: source
    });
};
Parser.prototype.parseModuleSpecifier = function parseModuleSpecifier (context) {
    // ModuleSpecifier :
    //StringLiteral
    if (this.token !== 3 /* StringLiteral */)
        { this.error(44 /* InvalidModuleSpecifier */); }
    return this.parseLiteral(context);
};
// import {<foo as bar>} ...;
Parser.prototype.parseImportSpecifier = function parseImportSpecifier (context) {
    var pos = this.getLocations();
    var imported;
    var local;
    if (this.isIdentifier(context, this.token)) {
        imported = this.parseBindingIdentifier(context);
        local = imported;
        // In the presence of 'as', the left-side of the 'as' can
        // be any IdentifierName. But without 'as', it must be a valid
        // BindingIdentifier.
        if (this.token === 65643 /* AsKeyword */) {
            // 'import {a \\u0061s b} from "./foo.js";'
            if (this.flags & 131072 /* HasUnicode */)
                { this.error(88 /* InvalidEscapedReservedWord */); }
            if (this.token === 65643 /* AsKeyword */) {
                this.expect(context, 65643 /* AsKeyword */);
                local = this.parseBindingPatternOrIdentifier(context);
            }
            else {
                this.error(42 /* MissingAsImportSpecifier */);
            }
        }
    }
    else {
        imported = this.parseIdentifier(context);
        local = imported;
        this.expect(context, 65643 /* AsKeyword */);
        local = this.parseBindingPatternOrIdentifier(context);
    }
    return this.finishNode(pos, {
        type: 'ImportSpecifier',
        local: local,
        imported: imported
    });
};
// {foo, bar as bas}
Parser.prototype.parseNamedImports = function parseNamedImports (context, specifiers) {
        var this$1 = this;

    //  NamedImports
    //  ImportedDefaultBinding, NameSpaceImport
    //  ImportedDefaultBinding, NamedImports
    this.expect(context, 131084 /* LeftBrace */);
    while (!this.parseOptional(context, 15 /* RightBrace */)) {
        // only accepts identifiers or keywords
        specifiers.push(this$1.parseImportSpecifier(context));
        this$1.parseOptional(context, 18 /* Comma */);
    }
};
// import <* as foo> ...;
Parser.prototype.parseImportNamespaceSpecifier = function parseImportNamespaceSpecifier (context) {
    var pos = this.getLocations();
    this.expect(context, 1051187 /* Multiply */);
    if (this.token !== 65643 /* AsKeyword */)
        { this.error(43 /* NoAsAfterImportNamespace */); }
    this.nextToken(context);
    var local = this.parseIdentifier(context);
    return this.finishNode(pos, {
        type: 'ImportNamespaceSpecifier',
        local: local
    });
};
// import <foo> ...;
Parser.prototype.parseImportDefaultSpecifier = function parseImportDefaultSpecifier (context) {
    return this.finishNode(this.getLocations(), {
        type: 'ImportDefaultSpecifier',
        local: this.parseIdentifier(context)
    });
};
Parser.prototype.parseImportDeclaration = function parseImportDeclaration (context) {
    // ImportDeclaration :
    //   'import' ImportClause 'from' ModuleSpecifier ';'
    //   'import' ModuleSpecifier ';'
    //
    // ImportClause :
    //   ImportedDefaultBinding
    //   NameSpaceImport
    //   NamedImports
    //   ImportedDefaultBinding ',' NameSpaceImport
    //   ImportedDefaultBinding ',' NamedImports
    //
    // NameSpaceImport :
    //   '*' 'as' ImportedBinding
    if (this.flags & 4 /* InFunctionBody */)
        { this.error(58 /* ImportDeclAtTopLevel */); }
    var pos = this.getLocations();
    var specifiers = [];
    this.expect(context, 12377 /* ImportKeyword */);
    switch (this.token) {
        // import 'foo';
        case 3 /* StringLiteral */:
            {
                var source = this.parseModuleSpecifier(context);
                this.consumeSemicolon(context);
                return this.finishNode(pos, {
                    type: 'ImportDeclaration',
                    specifiers: specifiers,
                    source: source
                });
            }
        case 131073 /* Identifier */:
            {
                specifiers.push(this.parseImportDefaultSpecifier(context));
                if (this.parseOptional(context, 18 /* Comma */)) {
                    switch (this.token) {
                        case 1051187 /* Multiply */:
                            // import foo, * as foo
                            specifiers.push(this.parseImportNamespaceSpecifier(context));
                            break;
                        case 131084 /* LeftBrace */:
                            // import foo, {bar}
                            this.parseNamedImports(context, specifiers);
                            break;
                        default:
                            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
                    }
                }
                break;
            }
        // import {bar}
        case 131084 /* LeftBrace */:
            this.parseNamedImports(context, specifiers);
            break;
        // import * as foo
        case 1051187 /* Multiply */:
            specifiers.push(this.parseImportNamespaceSpecifier(context));
            break;
        default:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
    }
    this.expect(context, 65649 /* FromKeyword */);
    var src = this.parseModuleSpecifier(context);
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'ImportDeclaration',
        specifiers: specifiers,
        source: src
    });
};
Parser.prototype.parseModuleItem = function parseModuleItem (context) {
    // ecma262/#prod-ModuleItem
    // ModuleItem :
    //ImportDeclaration
    //ExportDeclaration
    //StatementListItem
    switch (this.token) {
        // 'export'
        case 12371 /* ExportKeyword */:
            return this.parseExportDeclaration(context);
        // 'import'
        case 12377 /* ImportKeyword */:
            if (!(this.flags & 134217728 /* OptionsNext */ && this.nextTokenIsLeftParen(context))) {
                return this.parseImportDeclaration(context);
            }
        default:
            return this.parseStatementListItem(context);
    }
};
Parser.prototype.parseStatementListItem = function parseStatementListItem (context) {
    switch (this.token) {
        case 12371 /* ExportKeyword */:
            if (!(context & 1 /* Module */))
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
        case 12377 /* ImportKeyword */:
            // We must be careful not to parse a dynamic import
            // expression as an import declaration.
            if (this.flags & 134217728 /* OptionsNext */ && this.nextTokenIsLeftParen(context))
                { return this.parseStatement(context); }
            if (!(context & 1 /* Module */))
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
        case 12375 /* FunctionKeyword */:
            return this.parseFunctionDeclaration(context);
        case 12365 /* ClassKeyword */:
            return this.parseClassDeclaration(context);
        case 4206665 /* ConstKeyword */:
            return this.parseVariableStatement(context | (67108864 /* Const */));
        case 4214856 /* LetKeyword */:
            // If let follows identifier on the same line, it is an declaration. Parse it as a variable statement
            if (this.isLexical(context))
                { return this.parseVariableStatement(context | 134217728 /* Let */); }
        default:
            return this.parseStatement(context | 8192 /* AllowIn */);
    }
};
Parser.prototype.parseStatement = function parseStatement (context) {
    switch (this.token) {
        case 17 /* Semicolon */:
            return this.parseEmptyStatement(context);
        case 4206663 /* VarKeyword */:
            return this.parseVariableStatement(context);
        case 131084 /* LeftBrace */:
            return this.parseBlockStatement(context);
        case 12384 /* TryKeyword */:
            return this.parseTryStatement(context);
        case 12379 /* ReturnKeyword */:
            return this.parseReturnStatement(context);
        case 12376 /* IfKeyword */:
            return this.parseIfStatement(context);
        case 12367 /* DebuggerKeyword */:
            return this.parseDebuggerStatement(context);
        case 12366 /* ContinueKeyword */:
            return this.parseContinueStatement(context);
        case 12362 /* BreakKeyword */:
            return this.parseBreakStatement(context);
        case 12369 /* DoKeyword */:
            return this.parseDoWhileStatement(context);
        case 12385 /* WhileKeyword */:
            return this.parseWhileStatement(context);
        case 12386 /* WithKeyword */:
            return this.parseWithStatement(context);
        case 12381 /* SwitchKeyword */:
            return this.parseSwitchStatement(context | 8 /* Statement */);
        case 12383 /* ThrowKeyword */:
            return this.parseThrowStatement(context);
        case 12374 /* ForKeyword */:
            return this.parseForOrForInOrForOfStatement(context);
        case 12365 /* ClassKeyword */:
        case 12375 /* FunctionKeyword */:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
        case 65644 /* AsyncKeyword */:
            if (this.flags & 131072 /* HasUnicode */)
                { this.error(88 /* InvalidEscapedReservedWord */); }
            if (this.nextTokenIsFunctionKeyword(context)) {
                // Invalid: `do async function f() {} while (false)`
                // Invalid: `do async function* g() {} while (false)`
                // Invalid: `while (false) async function f() {}`
                // Invalid: `switch (0) { case 1: async function f() {} default: var f; }`
                if (this.flags & 2048 /* Break */)
                    { this.error(0 /* Unexpected */); }
                return this.parseFunctionDeclaration(context);
            }
        default:
            return this.parseLabelledStatement(context | 8192 /* AllowIn */);
    }
};
Parser.prototype.parseForOrForInOrForOfStatement = function parseForOrForInOrForOfStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12374 /* ForKeyword */);
    var state = 0;
    var init = null;
    var declarations = null;
    var kind = '';
    var body;
    var test = null;
    var token = this.token;
    // Asynchronous Iteration - Stage 3 proposal
    if (context & 2048 /* Await */ && this.parseOptional(context, 2162797 /* AwaitKeyword */)) {
        // Throw " Unexpected token 'await'" if the option 'next' flag isn't set
        if (!(this.flags & 134217728 /* OptionsNext */))
            { this.error(1 /* UnexpectedToken */, tokenDesc(token)); }
        state |= 8 /* Await */;
    }
    var savedFlag = this.flags;
    this.expect(context, 11 /* LeftParen */);
    if (this.token !== 17 /* Semicolon */) {
        switch (this.token) {
            case 4206663 /* VarKeyword */:
                state |= 1 /* Var */;
                break;
            case 4214856 /* LetKeyword */:
                state |= 2 /* Let */;
                break;
            case 4206665 /* ConstKeyword */:
                state |= 4 /* Const */;
                break;
            default: // ignore
        }
        if (state & 7 /* Variable */) {
            var startPos = this.getLocations();
            kind = tokenDesc(this.token);
            // 'var'
            if (state & 1 /* Var */)
                { this.expect(context, 4206663 /* VarKeyword */); }
            // 'let'
            if (state & 2 /* Let */) {
                this.expect(context, 4214856 /* LetKeyword */);
                context |= 134217728 /* Let */;
            }
            // 'const'
            if (state & 4 /* Const */) {
                this.expect(context, 4206665 /* ConstKeyword */);
                context |= 67108864 /* Const */;
            }
            declarations = this.parseVariableDeclarationList(context | 16384 /* ForStatement */);
            init = this.finishNode(startPos, {
                type: 'VariableDeclaration',
                declarations: declarations,
                kind: kind
            });
        }
        else {
            init = this.parseExpression(context & ~8192 /* AllowIn */ | 16384 /* ForStatement */);
        }
    }
    this.flags = savedFlag;
    switch (this.token) {
        // 'of'
        case 65650 /* OfKeyword */:
            this.parseOptional(context, 65650 /* OfKeyword */);
            if (state & 7 /* Variable */) {
                // Only a single variable declaration is allowed in a for of statement
                if (declarations && declarations[0].init != null)
                    { this.error(35 /* InvalidVarInitForOf */); }
            }
            else {
                this.reinterpretExpressionAsPattern(context | 16384 /* ForStatement */, init);
                if (!isValidDestructuringAssignmentTarget(init))
                    { this.error(36 /* InvalidLHSInForLoop */); }
            }
            var right = this.parseAssignmentExpression(context | 8192 /* AllowIn */);
            this.expect(context, 16 /* RightParen */);
            this.flags |= (4096 /* Continue */ | 2048 /* Break */);
            body = this.parseStatement(context | 16384 /* ForStatement */);
            this.flags = savedFlag;
            return this.finishNode(pos, {
                type: 'ForOfStatement',
                body: body,
                left: init,
                right: right,
                await: !!(state & 8 /* Await */)
            });
        // 'in'
        case 1062705 /* InKeyword */:
            if (state & 8 /* Await */)
                { this.error(64 /* ForAwaitNotOf */); }
            this.expect(context, 1062705 /* InKeyword */);
            if (!(state & 7 /* Variable */)) {
                this.reinterpretExpressionAsPattern(context | 16384 /* ForStatement */, init);
            }
            else if (declarations && declarations.length !== 1) {
                this.error(0 /* Unexpected */);
            }
            test = this.parseExpression(context | 8192 /* AllowIn */);
            this.expect(context, 16 /* RightParen */);
            this.flags |= (4096 /* Continue */ | 2048 /* Break */);
            body = this.parseStatement(context | 16384 /* ForStatement */);
            this.flags = savedFlag;
            return this.finishNode(pos, {
                type: 'ForInStatement',
                body: body,
                left: init,
                right: test
            });
        default:
            if (state & 8 /* Await */)
                { this.error(64 /* ForAwaitNotOf */); }
            var update = null;
            // Invalid: `for (var a = ++effects in {});`
            // Invalid: `for (var a = (++effects, -1) in stored = a, {a: 0, b: 1, c: 2}) {  ++iterations;  }`
            if (this.token === 16 /* RightParen */)
                { this.error(122 /* InvalidVarDeclInForIn */); }
            this.expect(context, 17 /* Semicolon */);
            if (this.token !== 17 /* Semicolon */ && this.token !== 16 /* RightParen */) {
                test = this.parseExpression(context | 8192 /* AllowIn */);
            }
            this.expect(context, 17 /* Semicolon */);
            if (this.token !== 16 /* RightParen */)
                { update = this.parseExpression(context | 8192 /* AllowIn */); }
            this.expect(context, 16 /* RightParen */);
            this.flags |= (4096 /* Continue */ | 2048 /* Break */);
            body = this.parseStatement(context | 16384 /* ForStatement */);
            this.flags = savedFlag;
            return this.finishNode(pos, {
                type: 'ForStatement',
                body: body,
                init: init,
                test: test,
                update: update
            });
    }
};
Parser.prototype.parseSwitchStatement = function parseSwitchStatement (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var SavedFlag = this.flags;
    this.expect(context, 12381 /* SwitchKeyword */);
    this.expect(context, 11 /* LeftParen */);
    var discriminant = this.parseExpression(context);
    this.expect(context, 16 /* RightParen */);
    this.expect(context, 131084 /* LeftBrace */);
    var cases = [];
    var hasDefault = false;
    this.flags |= (2048 /* Break */ | 8192 /* Switch */);
    while (this.token !== 15 /* RightBrace */) {
        var clause = this$1.parseSwitchCase(context);
        if (clause.test === null) {
            // Error on duplicate 'default' clauses
            if (hasDefault)
                { this$1.error(18 /* MultipleDefaultsInSwitch */); }
            hasDefault = true;
        }
        cases.push(clause);
    }
    this.flags = SavedFlag;
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'SwitchStatement',
        discriminant: discriminant,
        cases: cases
    });
};
Parser.prototype.parseSwitchCase = function parseSwitchCase (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var test;
    switch (this.token) {
        case 12363 /* CaseKeyword */:
            this.nextToken(context);
            test = this.parseExpression(context | 8192 /* AllowIn */);
            break;
        case 12368 /* DefaultKeyword */:
            this.nextToken(context);
            test = null;
            break;
        default:
            test = null;
    }
    this.expect(context, 21 /* Colon */);
    var consequent = [];
    loop: while (true) {
        switch (this$1.token) {
            case 15 /* RightBrace */:
            case 12368 /* DefaultKeyword */:
            case 12363 /* CaseKeyword */:
                break loop;
            default:
                consequent.push(this$1.parseStatementListItem(context));
        }
    }
    return this.finishNode(pos, {
        type: 'SwitchCase',
        test: test,
        consequent: consequent,
    });
};
Parser.prototype.parseThrowStatement = function parseThrowStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12383 /* ThrowKeyword */);
    if (this.flags & 1 /* LineTerminator */)
        { this.error(21 /* NewlineAfterThrow */); }
    var argument = this.parseExpression(context | 8192 /* AllowIn */);
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'ThrowStatement',
        argument: argument
    });
};
Parser.prototype.parseWithStatement = function parseWithStatement (context) {
    var pos = this.getLocations();
    // Invalid `"use strict"; with ({}) { }`
    if (context & 2 /* Strict */)
        { this.error(22 /* StrictModeWith */); }
    this.expect(context, 12386 /* WithKeyword */);
    this.expect(context, 11 /* LeftParen */);
    var object = this.parseExpression(context | 8192 /* AllowIn */);
    this.expect(context, 16 /* RightParen */);
    var body = this.parseStatement(context);
    return this.finishNode(pos, {
        type: 'WithStatement',
        object: object,
        body: body
    });
};
Parser.prototype.parseWhileStatement = function parseWhileStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12385 /* WhileKeyword */);
    this.expect(context, 11 /* LeftParen */);
    var test = this.parseExpression(context | 8192 /* AllowIn */);
    this.expect(context, 16 /* RightParen */);
    var savedFlag = this.flags;
    if (!(this.flags & 2048 /* Break */))
        { this.flags |= (4096 /* Continue */ | 2048 /* Break */); }
    var body = this.parseStatement(context);
    this.flags = savedFlag;
    return this.finishNode(pos, {
        type: 'WhileStatement',
        test: test,
        body: body
    });
};
Parser.prototype.parseDoWhileStatement = function parseDoWhileStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12369 /* DoKeyword */);
    var savedFlag = this.flags;
    if (!(this.flags & 2048 /* Break */))
        { this.flags |= (4096 /* Continue */ | 2048 /* Break */); }
    var body = this.parseStatement(context);
    this.flags = savedFlag;
    this.expect(context, 12385 /* WhileKeyword */);
    this.expect(context, 11 /* LeftParen */);
    var test = this.parseExpression(context | 8192 /* AllowIn */);
    this.expect(context, 16 /* RightParen */);
    this.parseOptional(context, 17 /* Semicolon */);
    return this.finishNode(pos, {
        type: 'DoWhileStatement',
        body: body,
        test: test
    });
};
Parser.prototype.parseContinueStatement = function parseContinueStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12366 /* ContinueKeyword */);
    var label = null;
    if (!(this.flags & 1 /* LineTerminator */) && this.token === 131073 /* Identifier */) {
        label = this.parseIdentifier(context);
        if (!hasOwn.call(this.labelSet, '@' + label.name))
            { this.error(98 /* UnknownLabel */, label.name); }
    }
    if (!(this.flags & 4096 /* Continue */) && !label)
        { this.error(16 /* BadContinue */); }
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'ContinueStatement',
        label: label
    });
};
Parser.prototype.parseBreakStatement = function parseBreakStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12362 /* BreakKeyword */);
    if (this.parseOptional(context, 17 /* Semicolon */)) {
        if (!(this.flags & (4096 /* Continue */ | 8192 /* Switch */)))
            { this.error(0 /* Unexpected */); }
        return this.finishNode(pos, {
            type: 'BreakStatement',
            label: null
        });
    }
    var label = null;
    if (!(this.flags & 1 /* LineTerminator */) && this.token === 131073 /* Identifier */) {
        label = this.parseIdentifier(context);
        if (!hasOwn.call(this.labelSet, '@' + label.name))
            { this.error(98 /* UnknownLabel */, label.name); }
    }
    if (!(this.flags & (2048 /* Break */ | 8192 /* Switch */)) && !label)
        { this.error(17 /* IllegalBreak */); }
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'BreakStatement',
        label: label
    });
};
Parser.prototype.nextTokenIsFunctionKeyword = function nextTokenIsFunctionKeyword (context) {
    var savedState = this.saveState();
    this.nextToken(context);
    var next = this.token;
    var line = this.line;
    this.rewindState(savedState);
    return this.line === line && next === 12375 /* FunctionKeyword */;
};
Parser.prototype.parseLabelledStatement = function parseLabelledStatement (context) {
    var pos = this.getLocations();
    var expr = this.parseExpression(context | 8192 /* AllowIn */);
    if (this.parseOptional(context, 21 /* Colon */) && expr.type === 'Identifier') {
        // Invalid: `for (const x of []) label1: label2: function f() {}`
        if (!(this.flags & 8192 /* Switch */) && context & 16384 /* ForStatement */ && this.token === 131073 /* Identifier */)
            { this.error(121 /* InvalidLabeledForOf */); }
        var key = '@' + expr.name;
        if (hasOwn.call(this.labelSet, key))
            { this.error(94 /* Redeclaration */, expr.name); }
        this.labelSet[key] = true;
        var body;
        if (this.token === 12375 /* FunctionKeyword */) {
            if (context & 2 /* Strict */)
                { this.error(15 /* StrictFunction */); }
            body = this.parseFunctionDeclaration(context & ~16384 /* ForStatement */ | 32768 /* AnnexB */);
        }
        else {
            body = this.parseStatement(context & ~16384 /* ForStatement */);
        }
        delete this.labelSet[key];
        return this.finishNode(pos, {
            type: 'LabeledStatement',
            label: expr,
            body: body
        });
    }
    else {
        this.consumeSemicolon(context);
        return this.finishNode(pos, {
            type: 'ExpressionStatement',
            expression: expr
        });
    }
};
Parser.prototype.parseDebuggerStatement = function parseDebuggerStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12367 /* DebuggerKeyword */);
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'DebuggerStatement'
    });
};
Parser.prototype.parseIfStatementChild = function parseIfStatementChild (context) {
    // ECMA 262 (Annex B.3.3)
    if (this.token === 12375 /* FunctionKeyword */) {
        if (context & 2 /* Strict */)
            { this.error(15 /* StrictFunction */); }
        return this.parseFunctionDeclaration(context | 32768 /* AnnexB */);
    }
    return this.parseStatement(context | 32768 /* AnnexB */);
};
Parser.prototype.parseIfStatement = function parseIfStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12376 /* IfKeyword */);
    this.expect(context, 11 /* LeftParen */);
    // An IF node has three kids: test, alternate, and optional else
    var test = this.parseExpression(context | 8192 /* AllowIn */);
    this.expect(context, 16 /* RightParen */);
    var savedFlag = this.flags;
    var consequent = this.parseIfStatementChild(context);
    var alternate = null;
    if (this.parseOptional(context, 12370 /* ElseKeyword */))
        { alternate = this.parseIfStatementChild(context); }
    this.flags = savedFlag;
    return this.finishNode(pos, {
        type: 'IfStatement',
        test: test,
        alternate: alternate,
        consequent: consequent
    });
};
Parser.prototype.parseReturnStatement = function parseReturnStatement (context) {
    var pos = this.getLocations();
    if (!(this.flags & 4 /* InFunctionBody */))
        { this.error(19 /* IllegalReturn */); }
    this.expect(context, 12379 /* ReturnKeyword */);
    var argument = null;
    if (!this.canConsumeSemicolon())
        { argument = this.parseExpression(context); }
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'ReturnStatement',
        argument: argument
    });
};
Parser.prototype.parseFunctionDeclaration = function parseFunctionDeclaration (context) {
    var pos = this.getLocations();
    var savedFlags = this.flags;
    var parentHasYield = !!(context & 4096 /* Yield */);
    if (context & (2048 /* Await */ | 4096 /* Yield */))
        { context &= ~(2048 /* Await */ | 4096 /* Yield */); }
    if (this.parseOptional(context, 65644 /* AsyncKeyword */)) {
        if (this.flags & 1 /* LineTerminator */)
            { this.error(87 /* LineBreakAfterAsync */); }
        context |= (2048 /* Await */ | 256 /* AsyncFunctionBody */);
    }
    this.expect(context, 12375 /* FunctionKeyword */);
    if (this.parseOptional(context, 1051187 /* Multiply */)) {
        if (context & 32768 /* AnnexB */)
            { this.error(1 /* UnexpectedToken */, this.tokenValue); }
        // If we are in the 'await' context. Check if the 'Next' option are set
        // and allow us of async generators. Throw a decent error message if this isn't the case
        if (context & 2048 /* Await */ && !(this.flags & 134217728 /* OptionsNext */)) {
            this.error(63 /* NotAnAsyncGenerator */);
        }
        // Async generators not allowed in statement position per the specs just NOW!
        context |= 4096 /* Yield */;
    }
    // Invalid: 'export function a() {} export function a() {}'
    if (context & 33554432 /* Export */ && this.token === 131073 /* Identifier */)
        { this.addFunctionArg(this.tokenValue); }
    var id = null;
    if (this.token !== 11 /* LeftParen */) {
        var name = this.tokenValue;
        if (parentHasYield && this.token === 20586 /* YieldKeyword */)
            { this.error(113 /* DisallowedInContext */, 'yield'); }
        // Invalid: 'async function wrap() { async function await() { } };'
        if (context & 256 /* AsyncFunctionBody */ && this.flags & 4 /* InFunctionBody */) {
            // await is not allowed as an identifier in functions nested in async functions
            if (this.token === 2162797 /* AwaitKeyword */)
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
            if (!(context & 2048 /* Await */))
                { context &= ~256 /* AsyncFunctionBody */; }
        }
        if (context & 8 /* Statement */ && !(context & 32768 /* AnnexB */)) {
            if (!this.initBlockScope() && name in this.blockScope) {
                if (this.blockScope[name] === 2 /* NonShadowable */ || this.blockScope !== this.functionScope) {
                    this.error(92 /* DuplicateIdentifier */, name);
                }
            }
            this.blockScope[name] = 1 /* Shadowable */;
        }
        id = this.parseBindingIdentifier(context &= ~8 /* Statement */);
        // Valid: `export default function() {};`
        // Invalid: `async function() { }`
        // Invalid: `async function *() {}`
        // Invalid: `async function*() { yield 1; };`
        // Invalid  `async function*() { yield; }`
        // Invalid: `function *() {}`
        // Invalid: `function() {};`
    }
    else if (!(context & 65536 /* OptionalIdentifier */)) {
        this.error(117 /* UnNamedFunctionStmt */);
    }
    var savedScope = this.enterFunctionScope();
    var params = this.parseFormalParameterList(context & ~(8 /* Statement */ | 65536 /* OptionalIdentifier */), 0 /* None */);
    var body = this.parseFunctionBody(context & ~(8 /* Statement */ | 65536 /* OptionalIdentifier */));
    this.exitFunctionScope(savedScope);
    this.flags = savedFlags;
    return this.finishNode(pos, {
        type: 'FunctionDeclaration',
        params: params,
        body: body,
        async: !!(context & 2048 /* Await */),
        generator: !!(context & 4096 /* Yield */),
        expression: false,
        id: id
    });
};
Parser.prototype.parseTryStatement = function parseTryStatement (context) {
    var pos = this.getLocations();
    this.expect(context, 12384 /* TryKeyword */);
    var block = this.parseBlockStatement(context);
    var handler = this.token === 12364 /* CatchKeyword */ ? this.parseCatchClause(context) : null;
    var finalizer = null;
    if (!handler || this.token === 12373 /* FinallyKeyword */) {
        this.expect(context, 12373 /* FinallyKeyword */);
        finalizer = this.parseBlockStatement(context);
    }
    if (!handler && !finalizer)
        { this.error(20 /* NoCatchOrFinally */); }
    return this.finishNode(pos, {
        type: 'TryStatement',
        block: block,
        handler: handler,
        finalizer: finalizer
    });
};
Parser.prototype.parseCatchClause = function parseCatchClause (context) {
    var pos = this.getLocations();
    this.expect(context, 12364 /* CatchKeyword */);
    var blockScope = this.blockScope;
    var parentScope = this.parentScope;
    if (blockScope !== undefined)
        { this.parentScope = blockScope; }
    this.blockScope = undefined;
    var param = null;
    if (!(this.flags & 134217728 /* OptionsNext */) || this.token === 11 /* LeftParen */) {
        this.expect(context, 11 /* LeftParen */);
        if (!hasMask(this.token, 131072 /* BindingPattern */))
            { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
        this.addCatchArg(this.tokenValue, 1 /* Shadowable */);
        param = this.parseBindingPatternOrIdentifier(context);
        this.expect(context, 16 /* RightParen */);
    }
    var body = this.parseBlockStatement(context | 131072 /* IfClause */);
    this.blockScope = blockScope;
    if (blockScope !== undefined)
        { this.parentScope = parentScope; }
    return this.finishNode(pos, {
        type: 'CatchClause',
        param: param,
        body: body
    });
};
Parser.prototype.parseBlockStatement = function parseBlockStatement (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var body = [];
    var flag = this.flags;
    var blockScope = this.blockScope;
    var parentScope = this.parentScope;
    if (blockScope != null)
        { this.parentScope = blockScope; }
    this.blockScope = context & 131072 /* IfClause */ ? blockScope : undefined;
    this.expect(context, 131084 /* LeftBrace */);
    while (this.token !== 15 /* RightBrace */)
        { body.push(this$1.parseStatementListItem(context | 8 /* Statement */)); }
    this.expect(context, 15 /* RightBrace */);
    this.flags = flag;
    this.blockScope = blockScope;
    if (parentScope != null)
        { this.parentScope = parentScope; }
    return this.finishNode(pos, {
        type: 'BlockStatement',
        body: body
    });
};
Parser.prototype.parseVariableStatement = function parseVariableStatement (context) {
    var pos = this.getLocations();
    var token = this.token;
    if (this.flags & 131072 /* HasUnicode */)
        { this.error(88 /* InvalidEscapedReservedWord */); }
    this.nextToken(context);
    // Invalid: 'async() => { var await; }'
    // Invalid: 'function() => { let await; }'
    // Invalid: 'var await = 1'
    if (context & (1 /* Module */ | 2048 /* Await */) && this.token === 2162797 /* AwaitKeyword */) {
        this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
    }
    // Invalid:'function* l() { var yield = 12 }'
    if (context & 4096 /* Yield */ && this.flags & 4 /* InFunctionBody */ && this.token === 20586 /* YieldKeyword */) {
        this.error(113 /* DisallowedInContext */, this.tokenValue);
    }
    var declarations = this.parseVariableDeclarationList(context &= ~16384 /* ForStatement */);
    this.consumeSemicolon(context);
    return this.finishNode(pos, {
        type: 'VariableDeclaration',
        declarations: declarations,
        kind: tokenDesc(token)
    });
};
Parser.prototype.isBindingPattern = function isBindingPattern (t) {
    return t === 131091 /* LeftBracket */ || t === 131084 /* LeftBrace */;
};
Parser.prototype.parseVariableDeclaration = function parseVariableDeclaration (context) {
    var init = null;
    var pos = this.getLocations();
    var token = this.token;
    var id = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    // Invalid 'for (var x o\u0066 []) ;';
    if (context & 16384 /* ForStatement */ && this.flags & 131072 /* HasUnicode */ && this.token === 65650 /* OfKeyword */) {
        this.error(88 /* InvalidEscapedReservedWord */);
    }
    // Invalid 'export let foo';
    // Invalid 'export const foo';
    // Invalid 'export var foo';
    if (context & 16777216 /* RequireInitializer */ && id.type === 'Identifier' && this.token !== 524317 /* Assign */) {
        this.error(120 /* MissingInitializer */);
    }
    // 'let', 'const'
    if (context & 201326592 /* Lexical */) {
        if (context & 67108864 /* Const */) {
            if (!(context & 16384 /* ForStatement */) && this.token !== 524317 /* Assign */) {
                this.error(34 /* DeclarationMissingInitializer */, 'const');
            }
            if (this.parseOptional(context, 524317 /* Assign */))
                { init = this.parseAssignmentExpression(context); }
        }
        else if ((!(context & 16384 /* ForStatement */) && token !== 131073 /* Identifier */) || this.token === 524317 /* Assign */) {
            this.expect(context, 524317 /* Assign */);
            init = this.parseAssignmentExpression(context);
        }
        // 'var'
    }
    else if (this.parseOptional(context, 524317 /* Assign */)) {
        init = this.parseAssignmentExpression(context);
    }
    else if (!(context & 16384 /* ForStatement */) && this.isBindingPattern(token)) {
        this.error(34 /* DeclarationMissingInitializer */, 'var');
    }
    return this.finishNode(pos, {
        type: 'VariableDeclarator',
        init: init,
        id: id
    });
};
Parser.prototype.parseVariableDeclarationList = function parseVariableDeclarationList (context) {
        var this$1 = this;

    var list = [this.parseVariableDeclaration(context)];
    while (this.parseOptional(context, 18 /* Comma */)) {
        list.push(this$1.parseVariableDeclaration(context));
    }
    return list;
};
Parser.prototype.parseEmptyStatement = function parseEmptyStatement (context) {
    var pos = this.getLocations();
    this.nextToken(context);
    return this.finishNode(pos, {
        type: 'EmptyStatement'
    });
};
Parser.prototype.parseExpression = function parseExpression (context) {
        var this$1 = this;

    // Expression[in]:
    //  AssignmentExpression[in]
    //  Expression[in] , AssignmentExpression[in]
    var pos = this.getLocations();
    var expr = this.parseAssignmentExpression(context);
    if (this.token === 18 /* Comma */) {
        var expressions = [expr];
        while (this.parseOptional(context, 18 /* Comma */)) {
            expressions.push(this$1.parseAssignmentExpression(context));
        }
        return this.finishNode(pos, {
            type: 'SequenceExpression',
            expressions: expressions
        });
    }
    return expr;
};
Parser.prototype.parseYieldExpression = function parseYieldExpression (context, pos) {
    // YieldExpression[In] :
    //  yield
    //  yield [no LineTerminator here] [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
    //  yield [no LineTerminator here] * [Lexical goal InputElementRegExp]AssignmentExpression[?In, Yield]
    this.expect(context, 20586 /* YieldKeyword */);
    // While`yield` is a valid statement within async generator function bodies,
    // 'yield' as labelled statement isn't.
    if (context & 256 /* AsyncFunctionBody */) {
        if (this.token === 21 /* Colon */)
            { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    }
    // Invalid: `function *g(x = yield){}`
    if (this.flags & 1024 /* ArgumentList */)
        { this.error(111 /* GeneratorParameter */); }
    if (this.flags & 1 /* LineTerminator */) {
        return this.finishNode(pos, {
            type: 'YieldExpression',
            argument: null,
            delegate: false
        });
    }
    var argument = null;
    var delegate = this.parseOptional(context, 1051187 /* Multiply */);
    if (delegate || isStartOfExpression(this.token, !!(this.flags && 2 /* JSX */))) {
        argument = this.parseAssignmentExpression(context);
    }
    return this.finishNode(pos, {
        type: 'YieldExpression',
        argument: argument,
        delegate: delegate
    });
};
// 12.15.5 Destructuring Assignment
Parser.prototype.parseAssignmentPattern = function parseAssignmentPattern (context, left, pos) {
    // Invalid: '({async foo(a = await b) {}})'
    if (this.flags & 1024 /* ArgumentList */ && this.token === 2162797 /* AwaitKeyword */)
        { this.error(0 /* Unexpected */); }
    var right = this.parseAssignmentExpression(context);
    return this.finishNode(pos, {
        type: 'AssignmentPattern',
        left: left,
        right: right
    });
};
Parser.prototype.parseAssignmentExpression = function parseAssignmentExpression (context) {
    var pos = this.getLocations();
    if (context & 4096 /* Yield */ && this.token === 20586 /* YieldKeyword */)
        { return this.parseYieldExpression(context, pos); }
    var expr = this.parseBinaryExpression(context, 0, pos);
    if (hasMask(this.token, 524288 /* AssignOperator */)) {
        var operator = this.token;
        if (context & 2 /* Strict */ && this.isEvalOrArguments(expr.name)) {
            this.error(39 /* StrictLHSAssignment */);
        }
        else if (operator === 524317 /* Assign */) {
            this.reinterpretExpressionAsPattern(context, expr);
        }
        else if (!isValidSimpleAssignmentTarget(expr)) {
            this.error(40 /* InvalidLHSInAssignment */);
        }
        this.nextToken(context);
        return this.finishNode(pos, {
            type: 'AssignmentExpression',
            left: expr,
            operator: tokenDesc(operator),
            right: this.parseAssignmentExpression(context),
        });
    }
    return this.parseConditionalExpression(context, expr, pos);
};
Parser.prototype.parseConditionalExpression = function parseConditionalExpression (context, expression, pos) {
    if (this.token !== 22 /* QuestionMark */)
        { return expression; }
    // Valid: '(b = c) => d ? (e, f) : g;'
    // Invalid: '() => {} ? 1 : 2;'
    if (!(context & 512 /* ConciseBody */) && this.flags & 32768 /* Arrow */)
        { return expression; }
    this.nextToken(context);
    var consequent = this.parseAssignmentExpression(context & ~512 /* ConciseBody */);
    this.expect(context, 21 /* Colon */);
    var alternate = this.parseAssignmentExpression(context & ~512 /* ConciseBody */);
    return this.finishNode(pos, {
        type: 'ConditionalExpression',
        test: expression,
        consequent: consequent,
        alternate: alternate
    });
};
Parser.prototype.getBinaryPrecedence = function getBinaryPrecedence (context) {
    if (hasMask(this.token, 1048576 /* BinaryOperator */))
        { return this.token & 3840 /* Precedence */; }
    return 0;
};
Parser.prototype.parseUnaryExpression = function parseUnaryExpression (context) {
    var pos = this.getLocations();
    var expr;
    if (hasMask(this.token, 2097152 /* UnaryOperator */)) {
        if (context & 2048 /* Await */ && this.token === 2162797 /* AwaitKeyword */)
            { return this.parseAwaitExpression(context, pos); }
        var token = this.token;
        expr = this.buildUnaryExpression(context);
        // When a delete operator occurs within strict mode code, a SyntaxError is thrown if its
        // UnaryExpression is a direct reference to a variable, function argument, or function name
        if (context & 2 /* Strict */ && token === 2109483 /* DeleteKeyword */ && expr.argument.type === 'Identifier') {
            this.error(52 /* StrictDelete */);
        }
        if (this.token === 1051446 /* Exponentiate */)
            { this.error(0 /* Unexpected */); }
    }
    else {
        expr = this.parseUpdateExpression(context, pos);
    }
    if (this.token !== 1051446 /* Exponentiate */)
        { return expr; }
    return this.parseBinaryExpression(context, this.getBinaryPrecedence(context), pos, expr);
};
Parser.prototype.buildUnaryExpression = function buildUnaryExpression (context) {
    var pos = this.getLocations();
    switch (this.token) {
        case 2109483 /* DeleteKeyword */:
        case 3148079 /* Add */:
        case 3148080 /* Subtract */:
        case 2097198 /* Complement */:
        case 2097197 /* Negate */:
        case 2109482 /* TypeofKeyword */:
        case 2109484 /* VoidKeyword */:
            var token = this.token;
            this.nextToken(context);
            return this.finishNode(pos, {
                type: 'UnaryExpression',
                operator: tokenDesc(token),
                argument: this.buildUnaryExpression(context),
                prefix: true
            });
        default:
            return this.parseUpdateExpression(context, pos);
    }
};
Parser.prototype.parseAwaitExpression = function parseAwaitExpression (context, pos) {
    this.expect(context, 2162797 /* AwaitKeyword */);
    var argument = this.buildUnaryExpression(context);
    return this.finishNode(pos, {
        type: 'AwaitExpression',
        argument: argument
    });
};
Parser.prototype.parseBinaryExpression = function parseBinaryExpression (context, precedence, pos, expression) {
        var this$1 = this;
        if ( expression === void 0 ) expression = this.parseUnaryExpression(context);

    loop: while (true) {
        // Get the binary precedence
        var binaryPrecedence = this$1.getBinaryPrecedence(context);
        // Bail out quickly if no binary precedence
        if (!binaryPrecedence)
            { return expression; }
        var operator = (void 0);
        switch (this$1.token) {
            case 1062705 /* InKeyword */:
                if (!(context & 8192 /* AllowIn */))
                    { break loop; }
            case 1051446 /* Exponentiate */:
                operator = binaryPrecedence >= precedence;
                break;
            default:
                operator = binaryPrecedence > precedence;
        }
        if (!operator)
            { break; }
        var binaryOperator = this$1.token;
        this$1.nextToken(context);
        expression = this$1.finishNode(pos, {
            type: (binaryOperator === 1049143 /* LogicalAnd */ || binaryOperator === 1048888 /* LogicalOr */) ?
                'LogicalExpression' : 'BinaryExpression',
            left: expression,
            right: this$1.parseBinaryExpression(context, binaryPrecedence, pos),
            operator: tokenDesc(binaryOperator)
        });
    }
    return expression;
};
Parser.prototype.parseUpdateExpression = function parseUpdateExpression (context, pos) {
    var expr;
    if (hasMask(this.token, 262144 /* UpdateOperator */)) {
        var operator = this.token;
        this.nextToken(context);
        expr = this.parseLeftHandSideExpression(context, pos);
        if (context & 2 /* Strict */ && this.isEvalOrArguments(expr.name)) {
            this.error(53 /* StrictLHSPrefix */);
        }
        else if (!isValidSimpleAssignmentTarget(expr))
            { this.error(40 /* InvalidLHSInAssignment */); }
        return this.finishNode(pos, {
            type: 'UpdateExpression',
            operator: tokenDesc(operator),
            prefix: true,
            argument: expr
        });
    }
    if (this.flags & 33554432 /* OptionsJSX */ && this.token === 1050431 /* LessThan */) {
        return this.parseJSXElement(context | 16 /* JSXChild */);
    }
    expr = this.parseLeftHandSideExpression(context, pos);
    if (hasMask(this.token, 262144 /* UpdateOperator */) && !(this.flags & 1 /* LineTerminator */)) {
        // The identifier eval or arguments may not appear as the LeftHandSideExpression of an
        // Assignment operator(12.15) or of a PostfixExpression or as the UnaryExpression
        // operated upon by a Prefix Increment(12.4.6) or a Prefix Decrement(12.4.7) operator.
        if (context & 2 /* Strict */ && this.isEvalOrArguments(expr.name)) {
            this.error(54 /* StrictLHSPostfix */);
        }
        if (!isValidSimpleAssignmentTarget(expr))
            { this.error(40 /* InvalidLHSInAssignment */); }
        var operator$1 = this.token;
        this.nextToken(context);
        return this.finishNode(pos, {
            type: 'UpdateExpression',
            argument: expr,
            operator: tokenDesc(operator$1),
            prefix: false
        });
    }
    return expr;
};
Parser.prototype.parseImportCall = function parseImportCall (context, pos) {
    this.expect(context, 12377 /* ImportKeyword */);
    // Invalid: 'function failsParse() { return import.then(); }'
    if (this.token !== 11 /* LeftParen */)
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    return this.finishNode(pos, {
        type: 'Import'
    });
};
Parser.prototype.parseLeftHandSideExpression = function parseLeftHandSideExpression (context, pos) {
    switch (this.token) {
        case 12377 /* ImportKeyword */:
            if (!(this.flags & 134217728 /* OptionsNext */))
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
            return this.parseCallExpression(context | 524288 /* DynamicImport */, pos, this.parseImportCall(context, pos));
        case 12380 /* SuperKeyword */:
            return this.parseCallExpression(context, pos, this.parseSuper(context));
        default:
            var expr = this.parseMemberExpression(context, pos);
            if (this.flags & 32768 /* Arrow */)
                { return expr; }
            return this.parseCallExpression(context, pos, expr);
    }
};
Parser.prototype.parseParenthesizedExpression = function parseParenthesizedExpression (context, pos) {
        var this$1 = this;

    this.expect(context, 11 /* LeftParen */);
    // Invalid `for(({a}) in 0);`
    // Invalid `for(({a}) of 0);`
    // Invalid `for(([a]) of 0);`
    // Invalid `for(([a]) in 0);`
    if (context & 16384 /* ForStatement */ && this.isBindingPattern(this.token)) {
        this.error(36 /* InvalidLHSInForLoop */);
    }
    if (this.parseOptional(context, 16 /* RightParen */)) {
        if (this.token === 10 /* Arrow */)
            { return this.parseArrowExpression(context & ~16384 /* ForStatement */, pos, []); }
        this.error(89 /* MissingArrowAfterParentheses */);
    }
    if (this.token === 14 /* Ellipsis */) {
        var rest = this.parseRestElement(context | 4194304 /* Binding */);
        this.expect(context, 16 /* RightParen */);
        // Valid: '(...a) => {};'
        if (this.token === 10 /* Arrow */)
            { return this.parseArrowExpression(context & ~16384 /* ForStatement */, pos, [rest]); }
        // Invalid: '(...,)'
        // Invalid: '(...a),'
        // Invalid: '(...a)$'
        // Invalid: '(...a), => {};'
        this.error(1 /* UnexpectedToken */, this.tokenValue);
    }
    var state = 0;
    var sequenceStartPos = this.startPos;
    // 'eval' or 'arguments' are invalid in binding position in strict mode
    // within arrow functions, but not inside parenthesis, so we can't just
    // throw an error right away
    if (context & 2 /* Strict */ &&
        this.token === 131073 /* Identifier */ &&
        this.isEvalOrArguments(this.tokenValue))
        { state |= 2 /* Reserved */; }
    var expr = [this.parseAssignmentExpression(context & ~16384 /* ForStatement */)];
    while (this.parseOptional(context, 18 /* Comma */)) {
        if (this$1.parseOptional(context, 16 /* RightParen */)) {
            if (this$1.token !== 10 /* Arrow */)
                { this$1.error(1 /* UnexpectedToken */, tokenDesc(this$1.token)); }
            state |= 8 /* TrailingComma */;
        }
        else if (this$1.token === 14 /* Ellipsis */) {
            // Invalid: '(...a) + 1'
            // Invalid: '(((...a)))'
            // Invalid: '(...a)'
            if (!(this$1.flags & 8 /* HasRest */))
                { this$1.flags |= 8 /* HasRest */; }
            expr.push(this$1.parseRestElement(context | 4194304 /* Binding */));
            break;
        }
        else {
            // Invalid: '((a), b) => 42'
            if (this$1.token === 11 /* LeftParen */)
                { state |= 4 /* WrappedInParen */; }
            if (this$1.token === 131073 /* Identifier */) {
                // Valid: '"use strict"; (foo, eval)'
                // Valid: '"use strict"; (foo, arguments)'
                // Invalid: '"use strict"; ((foo, eval) => 1);'
                // Invalid: '"use strict"; ((foo, arguments) => 1);'
                if (this$1.isEvalOrArguments(this$1.tokenValue))
                    { state |= 2 /* Reserved */; }
            }
            expr.push(this$1.parseAssignmentExpression(context & ~(16384 /* ForStatement */ | 1024 /* Parenthesis */)));
        }
    }
    // Save the 'SequenceExpression' end position before parsing out the right parenthesis
    var sequenceEndPos = this.endPos;
    if (!(state & 8 /* TrailingComma */))
        { this.expect(context, 16 /* RightParen */); }
    if (this.token === 10 /* Arrow */) {
        // Invalid: '(a)\n=> 0'
        if (this.flags & 1 /* LineTerminator */)
            { this.error(0 /* Unexpected */); }
        // Invalid: '((a), (b)) => 42'
        // Invalid: '((a), b) => 42'
        // Invalid: '(a, (b)) => 42'
        if (state & 4 /* WrappedInParen */)
            { this.error(0 /* Unexpected */); }
        if (context & 4096 /* Yield */ && this.flags & 4 /* InFunctionBody */)
            { this.error(110 /* YieldInParameter */); }
        // Invalid:  '([a.a]) => 42'
        if (this.flags & 32 /* HasMemberExpression */)
            { this.throwError(91 /* InvalidParenthesizedPattern */); }
        // Invalid: '"use strict"; ((foo, eval) => 1);'
        // Invalid: '"use strict"; ((foo, arguments) => 1);'
        if (state & 2 /* Reserved */)
            { this.error(112 /* StrictParamName */); }
        return this.parseArrowExpression(context & ~16384 /* ForStatement */, pos, expr);
    }
    // Invalid: '(...a)'
    if (this.flags & 8 /* HasRest */)
        { this.throwError(85 /* UnexpectedRestElement */); }
    this.flags &= ~32768 /* Arrow */;
    if (expr.length > 1) {
        return this.finishNodeAt(sequenceStartPos, sequenceEndPos, {
            type: 'SequenceExpression',
            expressions: expr
        });
    }
    return expr[0];
};
Parser.prototype.parseRestElement = function parseRestElement (context) {
    var pos = this.getLocations();
    this.expect(context, 14 /* Ellipsis */);
    var argument = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    if (this.token === 524317 /* Assign */)
        { this.error(28 /* DefaultRestParameter */); }
    if (this.token !== 16 /* RightParen */)
        { this.error(30 /* ParameterAfterRestParameter */); }
    return this.finishNode(pos, {
        type: 'RestElement',
        argument: argument
    });
};
Parser.prototype.parseBindingPatternOrIdentifier = function parseBindingPatternOrIdentifier (context) {
    switch (this.token) {
        case 131091 /* LeftBracket */:
            return this.parseAssignmentElementList(context);
        case 131084 /* LeftBrace */:
            return this.parseAssignmentPropertyList(context);
        default:
            return this.parseBindingIdentifier(context);
    }
};
Parser.prototype.parseBindingIdentifier = function parseBindingIdentifier (context) {
    var name = this.tokenValue;
    var token = this.token;
    // Let is disallowed as a lexically bound name
    if (context & 201326592 /* Lexical */ && token === 4214856 /* LetKeyword */) {
        this.error(66 /* LetInLexicalBinding */);
    }
    if (!this.isIdentifier(context, token))
        { this.error(0 /* Unexpected */); }
    if (context & 2 /* Strict */ && this.isEvalOrArguments(name))
        { this.error(39 /* StrictLHSAssignment */); }
    if (context & 2048 /* Await */ && token === 2162797 /* AwaitKeyword */) {
        this.error(1 /* UnexpectedToken */, tokenDesc(token));
    }
    if (this.flags & 131072 /* HasUnicode */ && this.token === 20586 /* YieldKeyword */)
        { this.error(88 /* InvalidEscapedReservedWord */); }
    if (!(context & 16384 /* ForStatement */))
        { this.addVarOrBlock(context, name); }
    var pos = this.getLocations();
    this.nextToken(context);
    return this.finishNode(pos, {
        type: 'Identifier',
        name: name
    });
};
Parser.prototype.parseAssignmentElementList = function parseAssignmentElementList (context) {
        var this$1 = this;

    var pos = this.getLocations();
    this.expect(context, 131091 /* LeftBracket */);
    if (this.flags & 1024 /* ArgumentList */)
        { this.flags |= 256 /* NonSimpleParameter */; }
    var elements = [];
    // Invalid:'function*g([yield]){}'
    if (context & 4096 /* Yield */ &&
        context & 4194304 /* Binding */ &&
        this.flags & 1024 /* ArgumentList */ &&
        this.token === 20586 /* YieldKeyword */)
        { this.error(113 /* DisallowedInContext */, tokenDesc(this.token)); }
    while (this.token !== 20 /* RightBracket */) {
        if (this$1.parseOptional(context, 18 /* Comma */)) {
            elements.push(null);
        }
        else {
            if (this$1.token === 14 /* Ellipsis */) {
                elements.push(this$1.parseAssignmentRestElement(context));
                break;
            }
            elements.push(this$1.parseArrayAssignmentPattern(context | 8192 /* AllowIn */));
            if (this$1.token !== 20 /* RightBracket */)
                { this$1.expect(context, 18 /* Comma */); }
        }
    }
    this.expect(context, 20 /* RightBracket */);
    return this.finishNode(pos, {
        type: 'ArrayPattern',
        elements: elements
    });
};
Parser.prototype.parseAssignmentRestElement = function parseAssignmentRestElement (context) {
    var pos = this.getLocations();
    this.expect(context, 14 /* Ellipsis */);
    var argument = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    if (this.token === 524317 /* Assign */)
        { this.error(28 /* DefaultRestParameter */); }
    return this.finishNode(pos, {
        type: 'RestElement',
        argument: argument
    });
};
Parser.prototype.parseArrayAssignmentPattern = function parseArrayAssignmentPattern (context) {
    var pos = this.getLocations();
    var left = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    if (!this.parseOptional(context, 524317 /* Assign */))
        { return left; }
    return this.parseAssignmentPattern(context, left, pos);
};
Parser.prototype.parseAssignmentPropertyList = function parseAssignmentPropertyList (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var properties = [];
    if (this.flags & 1024 /* ArgumentList */)
        { this.flags |= 256 /* NonSimpleParameter */; }
    this.expect(context, 131084 /* LeftBrace */);
    while (this.token !== 15 /* RightBrace */) {
        if (this$1.token === 14 /* Ellipsis */) {
            if (!(this$1.flags & 134217728 /* OptionsNext */))
                { this$1.error(1 /* UnexpectedToken */, tokenDesc(this$1.token)); }
            properties.push(this$1.parseRestProperty(context));
        }
        else {
            properties.push(this$1.parseAssignmentProperty(context));
        }
        if (this$1.token !== 15 /* RightBrace */)
            { this$1.parseOptional(context, 18 /* Comma */); }
    }
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'ObjectPattern',
        properties: properties
    });
};
Parser.prototype.parseObjectPropertyKey = function parseObjectPropertyKey (context) {
    switch (this.token) {
        case 3 /* StringLiteral */:
        case 2 /* NumericLiteral */:
            return this.parseLiteral(context);
        case 131091 /* LeftBracket */:
            this.expect(context, 131091 /* LeftBracket */);
            var expression = this.parseExpression(context);
            this.expect(context, 20 /* RightBracket */);
            return expression;
        default:
            return this.parseIdentifier(context);
    }
};
Parser.prototype.parseAssignmentProperty = function parseAssignmentProperty (context) {
    var pos = this.getLocations();
    var method = false;
    var token = this.token;
    var isIdentifier = this.isIdentifier(context, this.token);
    var computed = false;
    var shorthand = false;
    var value;
    var key;
    if (isIdentifier) {
        var tokenValue = this.tokenValue;
        computed = this.token === 131091 /* LeftBracket */;
        key = this.parseObjectPropertyKey(context);
        var init = this.finishNode(pos, {
            type: 'Identifier',
            name: tokenValue
        });
        if (this.parseOptional(context, 524317 /* Assign */)) {
            // Invalid: 'function*g() { var {yield = 0} = 0; }'
            if (context & 4096 /* Yield */ &&
                this.flags & 4 /* InFunctionBody */ &&
                token === 20586 /* YieldKeyword */)
                { this.error(113 /* DisallowedInContext */, tokenValue); }
            shorthand = true;
            value = this.parseAssignmentPattern(context, init, pos);
        }
        else if (this.parseOptional(context, 21 /* Colon */)) {
            if (context & 4096 /* Yield */ && this.flags & 1024 /* ArgumentList */ && this.token === 20586 /* YieldKeyword */) {
                this.error(113 /* DisallowedInContext */, tokenValue);
            }
            value = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
            if (this.parseOptional(context, 524317 /* Assign */))
                { value = this.parseAssignmentPattern(context, value, pos); }
        }
        else {
            // Note! This validation may seem a little odd. However. If we do this later on, we have to
            // parse out the binding identifier - 'yield'. If we do that, the index and token postion have
            // changed. Doing it like this we can report 'yield' as the invalid token, and the correct
            // token position which are *before* we parse out the binding identifier.
            if (context & 4194304 /* Binding */) {
                if (context & 4096 /* Yield */ && token === 20586 /* YieldKeyword */) {
                    // Invalid: 'function*g({yield}){}'
                    if (this.flags & 1024 /* ArgumentList */)
                        { this.error(111 /* GeneratorParameter */); }
                    // Valid: 'function g() { var {yield} = 0; }'
                    // Invalid: 'function* g() { var {yield} = 0; }'
                    // Invalid: '"use strict"; function g() { var {yield} = 0; }'
                    if (this.flags & 4 /* InFunctionBody */)
                        { this.error(113 /* DisallowedInContext */, tokenValue); }
                }
            }
            shorthand = true;
            value = init;
        }
    }
    else {
        computed = this.token === 131091 /* LeftBracket */;
        key = this.parseObjectPropertyKey(context);
        this.expect(context, 21 /* Colon */);
        value = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
        if (this.parseOptional(context, 524317 /* Assign */)) {
            value = this.parseAssignmentPattern(context, value, pos);
        }
    }
    return this.finishNode(pos, {
        type: 'Property',
        kind: 'init',
        key: key,
        computed: computed,
        value: value,
        method: method,
        shorthand: shorthand
    });
};
Parser.prototype.parseRestProperty = function parseRestProperty (context) {
    var pos = this.getLocations();
    this.expect(context, 14 /* Ellipsis */);
    if (this.token !== 131073 /* Identifier */)
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    var arg = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    if (this.token === 524317 /* Assign */)
        { this.error(23 /* DefaultRestProperty */); }
    return this.finishNode(pos, {
        type: 'RestElement',
        argument: arg
    });
};
Parser.prototype.parseComputedPropertyName = function parseComputedPropertyName (context) {
    this.expect(context, 131091 /* LeftBracket */);
    if (context & 4096 /* Yield */ && this.flags & 1024 /* ArgumentList */)
        { context &= ~4096 /* Yield */; }
    var expression = this.parseExpression(context | 8192 /* AllowIn */);
    this.expect(context, 20 /* RightBracket */);
    return expression;
};
Parser.prototype.reinterpretExpressionAsPattern = function reinterpretExpressionAsPattern (context, params) {
        var this$1 = this;

    switch (params.type) {
        case 'Identifier':
        case 'MemberExpression':
        case 'AssignmentPattern':
        case 'ArrayPattern':
        case 'ObjectPattern':
            return;
        case 'ObjectExpression':
            params.type = 'ObjectPattern';
            // ObjectPattern and ObjectExpression are isomorphic
            for (var i = 0; i < params.properties.length; i++) {
                var property = params.properties[i];
                if (property.kind !== 'init')
                    { this$1.error(1 /* UnexpectedToken */, tokenDesc(this$1.token)); }
                this$1.reinterpretExpressionAsPattern(context, property.type === 'SpreadElement' ? property : property.value);
            }
            return;
        case 'ArrayExpression':
            params.type = 'ArrayPattern';
            for (var i$1 = 0; i$1 < params.elements.length; ++i$1) {
                // skip holes in pattern
                if (params.elements[i$1] !== null)
                    { this$1.reinterpretExpressionAsPattern(context, params.elements[i$1]); }
            }
            return;
        case 'AssignmentExpression':
            params.type = 'AssignmentPattern';
            if (params.operator !== '=')
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
            delete params.operator;
            this.reinterpretExpressionAsPattern(context, params.left);
            return;
        case 'SpreadElement':
            if (params.argument.type === 'AssignmentExpression') {
                this.error(context & 16384 /* ForStatement */ ? 38 /* InvalidLHSInForIn */ : 40 /* InvalidLHSInAssignment */);
            }
            params.type = 'RestElement';
            this.reinterpretExpressionAsPattern(context, params.argument);
            return;
        default:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
    }
};
Parser.prototype.parseArrowExpression = function parseArrowExpression (context, pos, params) {
    // Invalid:  'async abc\n => function () {  }'
    if (this.flags & 1 /* LineTerminator */)
        { this.error(41 /* UnexpectedArrow */); }
    this.expect(context, 10 /* Arrow */);
    this.flags &= ~(32768 /* Arrow */ | 65536 /* AsyncArrow */);
    { this.flags |= 32768 /* Arrow */; }
    var savedScope = this.enterFunctionScope();
    var body;
    var expression = true;
    // An 'simple arrow' is just a plain identifier
    if (!(context & 64 /* SimpleArrow */))
        { params = this.parseArrowFormalList(context | 4194304 /* Binding */, params); }
    if (this.token === 131084 /* LeftBrace */) {
        expression = false;
        body = this.parseFunctionBody(context & ~(64 /* SimpleArrow */ | 4096 /* Yield */ | 1024 /* Parenthesis */));
    }
    else {
        this.flags &= ~32768 /* Arrow */;
        body = this.parseAssignmentExpression(context & ~(64 /* SimpleArrow */ | 4096 /* Yield */) | 512 /* ConciseBody */ | 1024 /* Parenthesis */);
    }
    this.exitFunctionScope(savedScope);
    return this.finishNode(pos, {
        type: 'ArrowFunctionExpression',
        id: null,
        params: params,
        body: body,
        generator: false,
        expression: expression,
        async: !!(context & 2048 /* Await */)
    });
};
Parser.prototype.parseArrowFormalList = function parseArrowFormalList (context, params) {
        var this$1 = this;

    for (var idx = 0; idx < params.length; idx++) {
        this$1.parseArrowFormalParameter(context, params[idx]);
    }
    return params;
};
Parser.prototype.parseArrowFormalParameter = function parseArrowFormalParameter (context, params) {
        var this$1 = this;

    switch (params.type) {
        case 'Identifier':
            this.addFunctionArg(params.name);
            return;
        case 'SpreadElement':
            params.type = 'RestElement';
            this.parseArrowFormalParameter(context, params.argument);
            return;
        case 'RestElement':
            this.parseArrowFormalParameter(context, params.argument);
            return;
        case 'ArrayExpression':
            params.type = 'ArrayPattern';
            for (var i = 0; i < params.elements.length; ++i) {
                // skip holes in pattern
                if (params.elements[i] !== null)
                    { this$1.parseArrowFormalParameter(context, params.elements[i]); }
            }
            return;
        case 'AssignmentPattern':
            this.parseArrowFormalParameter(context, params.left);
            return;
        case 'ArrayPattern':
            for (var i$1 = 0; i$1 < params.elements.length; ++i$1) {
                // skip holes in pattern
                if (params.elements[i$1] !== null)
                    { this$1.parseArrowFormalParameter(context, params.elements[i$1]); }
            }
            return;
        case 'ObjectExpression':
            params.type = 'ObjectPattern';
            // ObjectPattern and ObjectExpression are isomorphic
            for (var i$2 = 0; i$2 < params.properties.length; i$2++) {
                var property = params.properties[i$2];
                this$1.parseArrowFormalParameter(context, property.type === 'SpreadElement' ? property : property.value);
            }
            return;
        case 'ObjectPattern':
            // ObjectPattern and ObjectExpression are isomorphic
            for (var i$3 = 0; i$3 < params.properties.length; i$3++) {
                var property$1 = params.properties[i$3];
                this$1.parseArrowFormalParameter(context, property$1.type === 'RestElement' ? property$1 : property$1.value);
            }
            return;
        case 'AssignmentExpression':
            params.type = 'AssignmentPattern';
            delete params.operator;
            this.parseArrowFormalParameter(context, params.left);
            return;
        default:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
    }
};
Parser.prototype.parseSuper = function parseSuper (context) {
    var pos = this.getLocations();
    this.expect(context, 12380 /* SuperKeyword */);
    switch (this.token) {
        case 11 /* LeftParen */:
            // The super property has to be within a class constructor
            if (!hasMask(this.flags, 16384 /* AllowConstructorWithSupoer */))
                { this.error(76 /* BadSuperCall */); }
            break;
        case 13 /* Period */:
        case 131091 /* LeftBracket */:
            if (!(this.flags & 512 /* AllowSuper */))
                { this.error(76 /* BadSuperCall */); }
            break;
        default:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
    }
    return this.finishNode(pos, {
        type: 'Super'
    });
};
Parser.prototype.parseFunctionBody = function parseFunctionBody (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var body = [];
    var savedFunction = hasMask(this.flags, 4 /* InFunctionBody */);
    var savedFlags = this.flags;
    this.flags |= 4 /* InFunctionBody */;
    this.expect(context, 131084 /* LeftBrace */);
    var previousLabelSet = this.labelSet;
    this.labelSet = {};
    while (this.token !== 15 /* RightBrace */) {
        var item = this$1.parseStatementListItem(context);
        body.push(item);
        if (!isDirective(item))
            { break; }
        if (item.expression.value === 'use strict') {
            context |= 2 /* Strict */;
            // Invalid: 'package => { "use strict"}'
            if (this$1.flags & 64 /* HasReservedWord */)
                { this$1.error(108 /* UnexpectedStrictReserved */); }
            // Invalid:  '(function a(eval) { "use strict"; })'
            // Invalid:  '(function a(arguments) { "use strict"; })'
            if (this$1.flags & 128 /* HasEvalArgInParam */)
                { this$1.error(112 /* StrictParamName */); }
            // Invalid: 'function a([ option1, option2 ] = []) {  "use strict"; }'
            if (this$1.flags & 256 /* NonSimpleParameter */)
                { this$1.error(29 /* IllegalUseStrict */); }
            break;
        }
    }
    if (this.flags & 64 /* HasReservedWord */)
        { this.flags & ~64 /* HasReservedWord */; }
    while (this.token !== 15 /* RightBrace */)
        { body.push(this$1.parseStatementListItem(context)); }
    this.labelSet = previousLabelSet;
    this.flags = savedFlags;
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'BlockStatement',
        body: body
    });
};
Parser.prototype.parseCallExpression = function parseCallExpression (context, pos, expr) {
        var this$1 = this;

    while (true) {
        expr = this$1.parseMemberExpression(context, pos, expr);
        switch (this$1.token) {
            // '('
            case 11 /* LeftParen */:
                // parses both 'CallExpression' and async head
                var args = this$1.parseArguments(context);
                switch (this$1.token) {
                    // '=>'
                    case 10 /* Arrow */:
                        if (this$1.flags & 65536 /* AsyncArrow */) {
                            expr = this$1.parseArrowExpression(context | 2048 /* Await */, pos, args);
                            break;
                        }
                    // falls through
                    default:
                        if (context & 524288 /* DynamicImport */ && args.length !== 1 &&
                            expr.type === 'Import')
                            { this$1.error(14 /* BadImportCallArity */); }
                        expr = this$1.finishNode(pos, {
                            type: 'CallExpression',
                            arguments: args,
                            callee: expr
                        });
                }
                // Remove the 'Arrow' flags now, else we are in deep shit
                this$1.flags &= ~32768 /* Arrow */;
                break;
            default:
                return expr;
        }
    }
};
Parser.prototype.parseNonComputedMemberExpression = function parseNonComputedMemberExpression (context, expr, pos) {
    var property = this.parseIdentifier(context);
    return this.finishNode(pos, {
        type: 'MemberExpression',
        object: expr,
        computed: false,
        property: property,
    });
};
Parser.prototype.parseComputedMemberExpression = function parseComputedMemberExpression (context, expr, pos) {
    var property = this.parseExpression(context);
    return this.finishNode(pos, {
        type: 'MemberExpression',
        object: expr,
        computed: true,
        property: property,
    });
};
Parser.prototype.parseMemberExpression = function parseMemberExpression (context, pos, expr) {
        var this$1 = this;
        if ( expr === void 0 ) expr = this.parsePrimaryExpression(context, pos);

    while (true) {
        if (this$1.parseOptional(context, 13 /* Period */)) {
            if (context & 1024 /* Parenthesis */ && !(this$1.flags & 32 /* HasMemberExpression */)) {
                this$1.errorLocation = this$1.trackErrorLocation();
                this$1.flags |= 32 /* HasMemberExpression */;
            }
            expr = this$1.parseNonComputedMemberExpression(context, expr, pos);
            continue;
        }
        if (this$1.parseOptional(context, 131091 /* LeftBracket */)) {
            // Invalid: `new Type[]`
            if (context & 1048576 /* NewExpression */ && this$1.token === 20 /* RightBracket */)
                { this$1.error(68 /* InvalidStartOfExpression */); }
            expr = this$1.parseComputedMemberExpression(context | 8192 /* AllowIn */, expr, pos);
            this$1.expect(context, 20 /* RightBracket */);
            expr = this$1.finishNode(pos, expr);
            continue;
        }
        if (this$1.token === 8 /* TemplateCont */) {
            var quasi = this$1.parseTemplate(context, this$1.getLocations());
            expr = this$1.parseTaggedTemplateExpression(context, expr, quasi, pos);
            continue;
        }
        if (this$1.token === 9 /* TemplateTail */) {
            var quasi$1 = this$1.parseTemplateTail(context, this$1.getLocations());
            expr = this$1.parseTaggedTemplateExpression(context, expr, quasi$1, pos);
            continue;
        }
        return expr;
    }
};
Parser.prototype.parseArguments = function parseArguments (context) {
        var this$1 = this;

    this.expect(context, 11 /* LeftParen */);
    var args = [];
    while (this.token !== 16 /* RightParen */) {
        if (this$1.token === 14 /* Ellipsis */) {
            args.push(this$1.parseSpreadElement(context));
        }
        else {
            if (this$1.flags & 65536 /* AsyncArrow */) {
                // Invalid `"use strict"; async(eval) => {}`
                if (this$1.token === 131073 /* Identifier */ && this$1.isEvalOrArguments(this$1.tokenValue))
                    { this$1.error(108 /* UnexpectedStrictReserved */); }
            }
            args.push(this$1.parseAssignmentExpression(context & ~524288 /* DynamicImport */));
        }
        if (!this$1.parseOptional(context, 18 /* Comma */))
            { break; }
    }
    this.expect(context, 16 /* RightParen */);
    return args;
};
Parser.prototype.parseMetaProperty = function parseMetaProperty (context, meta, pos) {
    var property = this.parseIdentifier(context);
    return this.finishNode(pos, {
        meta: meta,
        type: 'MetaProperty',
        property: property
    });
};
Parser.prototype.parseNewExpression = function parseNewExpression (context) {
    var pos = this.getLocations();
    if (this.flags & 131072 /* HasUnicode */)
        { this.error(88 /* InvalidEscapedReservedWord */); }
    var id = this.parseIdentifier(context);
    switch (this.token) {
        // '.'
        case 13 /* Period */:
            this.expect(context, 13 /* Period */);
            if (this.token === 131073 /* Identifier */) {
                if (this.tokenValue !== 'target')
                    { this.error(33 /* MetaNotInFunctionBody */); }
                if (this.flags & 1024 /* ArgumentList */)
                    { return this.parseMetaProperty(context, id, pos); }
                if (!(this.flags & 4 /* InFunctionBody */))
                    { this.error(33 /* MetaNotInFunctionBody */); }
            }
            return this.parseMetaProperty(context, id, pos);
        // 'import'
        case 12377 /* ImportKeyword */:
            this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
        default:
            return this.finishNode(pos, {
                type: 'NewExpression',
                callee: this.parseMemberExpression(context | 1048576 /* NewExpression */, pos),
                arguments: this.token === 11 /* LeftParen */ ? this.parseArguments(context) : []
            });
    }
};
Parser.prototype.parseSpreadElement = function parseSpreadElement (context) {
    var pos = this.getLocations();
    // Disallow SpreadElement inside dynamic import
    if (context & 524288 /* DynamicImport */)
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    this.expect(context, 14 /* Ellipsis */);
    return this.finishNode(pos, {
        type: 'SpreadElement',
        argument: this.parseAssignmentExpression(context)
    });
};
Parser.prototype.parseArrayExpression = function parseArrayExpression (context) {
        var this$1 = this;

    var pos = this.getLocations();
    this.expect(context, 131091 /* LeftBracket */);
    var elements = [];
    while (this.token !== 20 /* RightBracket */) {
        if (this$1.parseOptional(context, 18 /* Comma */)) {
            elements.push(null);
        }
        else if (this$1.token === 14 /* Ellipsis */) {
            var element = this$1.parseSpreadElement(context);
            if (this$1.token !== 20 /* RightBracket */) {
                this$1.expect(context, 18 /* Comma */);
            }
            elements.push(element);
        }
        else {
            elements.push(this$1.parseAssignmentExpression(context | 8192 /* AllowIn */));
            if (this$1.token !== 20 /* RightBracket */) {
                this$1.expect(context, 18 /* Comma */);
            }
        }
    }
    this.expect(context, 20 /* RightBracket */);
    return this.finishNode(pos, {
        type: 'ArrayExpression',
        elements: elements
    });
};
Parser.prototype.parseFunctionExpression = function parseFunctionExpression (context) {
    var parentHasYield = !!(context & 4096 /* Yield */);
    if (context & (4096 /* Yield */ | 2048 /* Await */))
        { context &= ~(4096 /* Yield */ | 2048 /* Await */); }
    var pos = this.getLocations();
    if (this.parseOptional(context, 65644 /* AsyncKeyword */)) {
        if (this.flags & 1 /* LineTerminator */)
            { this.error(87 /* LineBreakAfterAsync */); }
        context |= (2048 /* Await */ | 256 /* AsyncFunctionBody */);
    }
    this.expect(context, 12375 /* FunctionKeyword */);
    if (this.parseOptional(context, 1051187 /* Multiply */)) {
        // If we are in the 'await' context. Check if the 'Next' option are set
        // and allow us to use async generators. If not, throw a decent error message if this isn't the case
        if (context & 2048 /* Await */ && !(this.flags & 134217728 /* OptionsNext */))
            { this.error(63 /* NotAnAsyncGenerator */); }
        context |= 4096 /* Yield */;
    }
    var name = null;
    if (this.token !== 11 /* LeftParen */) {
        // Invalid: '"use strict";(async function eval() {  })'
        // Invalid: '"use strict";(async function arguments () {  })'
        // Invalid: `"use strict"; (async function* eval() { });`
        // Invalid: `"use strict"; (async function* arguments() { });`
        // Invalid: `function hello() {'use strict'; (function eval() { }()) }`
        if (context & 2 /* Strict */ && this.token === 131073 /* Identifier */ && this.isEvalOrArguments(this.tokenValue))
            { this.error(39 /* StrictLHSAssignment */); }
        // Valid: 'function* fn() { (function yield() {}); }'
        // Invalid: '(async function* yield() { });'
        // Invalid: '(function* yield() {})'
        // Invalid: '+function* yield() {}'
        if ((context & 6144 /* AwaitOrYield */ || (context & 2 /* Strict */ && parentHasYield)) && this.token === 20586 /* YieldKeyword */)
            { this.error(109 /* YieldReservedWord */); }
        // Invalid `(async function* await() { });`
        if (context & 6144 /* AwaitOrYield */ && this.token === 2162797 /* AwaitKeyword */)
            { this.error(0 /* Unexpected */); }
        // **Module code only**
        // Invalid: '(function package() {'use strict'; })()'
        // Invalid: '"use strict"; (function package() {})()'
        if (context & 1 /* Module */ && hasMask(this.token, 20480 /* FutureReserved */)) {
            this.error(108 /* UnexpectedStrictReserved */);
        }
        name = this.parseIdentifier(context);
    }
    var savedScope = this.enterFunctionScope();
    var params = this.parseFormalParameterList(context, 0 /* None */);
    var body = this.parseFunctionBody(context);
    this.exitFunctionScope(savedScope);
    return this.finishNode(pos, {
        type: 'FunctionExpression',
        params: params,
        body: body,
        async: !!(context & 2048 /* Await */),
        generator: !!(context & 4096 /* Yield */),
        expression: false,
        id: name
    });
};
Parser.prototype.parseFormalParameterList = function parseFormalParameterList (context, flags) {
        var this$1 = this;

    this.expect(context, 11 /* LeftParen */);
    this.flags &= ~256 /* NonSimpleParameter */;
    // Invalid: 'function t(if) {}'
    // Invalid: '(function t(if) {})'
    if (hasMask(this.token, 12288 /* Reserved */))
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    // Invalid: 'function *g(yield){}'
    // Invalid: '(function *g(yield){})'
    // Invalid: '(function*() { function*(x = yield 3) {} })'
    if (context & 4096 /* Yield */ && !(context & 2097152 /* Method */) && this.token === 20586 /* YieldKeyword */)
        { this.error(113 /* DisallowedInContext */, tokenDesc(this.token)); }
    this.flags |= 1024 /* ArgumentList */;
    var result = [];
    while (this.token !== 16 /* RightParen */) {
        if (this$1.token === 14 /* Ellipsis */) {
            if (flags & 2 /* Setter */)
                { this$1.error(27 /* BadSetterRestParameter */); }
            this$1.flags |= 256 /* NonSimpleParameter */;
            result.push(this$1.parseRestElement(context & ~2097152 /* Method */ | 4194304 /* Binding */));
            this$1.parseOptional(context, 18 /* Comma */);
            break;
        }
        result.push(this$1.parseFormalParameter(context &= ~2097152 /* Method */, flags));
        if (this$1.token !== 16 /* RightParen */)
            { this$1.expect(context, 18 /* Comma */); }
    }
    if (flags & 1 /* Getter */ && result.length > 0)
        { this.error(25 /* BadGetterArity */); }
    if (flags & 2 /* Setter */ && result.length !== 1)
        { this.error(26 /* BadSetterArity */); }
    this.flags &= ~1024 /* ArgumentList */;
    this.expect(context, 16 /* RightParen */);
    return result;
};
Parser.prototype.parseFormalParameter = function parseFormalParameter (context, flags) {
    var pos = this.getLocations();
    // Invalid: 'function a(yield){ 'use strict'; }':
    if (hasMask(this.token, 20480 /* FutureReserved */)) {
        this.errorLocation = this.trackErrorLocation();
        this.flags |= 64 /* HasReservedWord */;
    }
    // Invalid: '`async function f(await) {}`':
    // if (context & Context.Await && this.token === Token.AwaitKeyword) this.error(Errors.UnexpectedToken, tokenDesc(this.token));
    if (this.token === 131073 /* Identifier */) {
        if (context & 2 /* Strict */)
            { this.addFunctionArg(this.tokenValue); }
        if (this.isEvalOrArguments(this.tokenValue)) {
            this.errorLocation = this.trackErrorLocation();
            this.flags |= 128 /* HasEvalArgInParam */;
        }
    }
    var param = this.parseBindingPatternOrIdentifier(context | 4194304 /* Binding */);
    if (!this.parseOptional(context, 524317 /* Assign */))
        { return param; }
    return this.parseAssignmentPattern(context, param, pos);
};
Parser.prototype.parseIdentifierOrArrow = function parseIdentifierOrArrow (context, pos) {
    var token = this.token;
    var tokenValue = this.tokenValue;
    if (!this.isIdentifier(context, this.token))
        { this.error(1 /* UnexpectedToken */, tokenDesc(token)); }
    var expr = this.parseIdentifier(context);
    context &= ~2048 /* Await */;
    this.flags &= ~32768 /* Arrow */;
    if (this.token === 10 /* Arrow */) {
        // Invalid: 'var af = switch => 1;'
        if (hasMask(token, 12288 /* Reserved */))
            { this.error(1 /* UnexpectedToken */, tokenDesc(token)); }
        if (hasMask(token, 20480 /* FutureReserved */)) {
            if (context & 2 /* Strict */)
                { this.error(108 /* UnexpectedStrictReserved */); }
            // Invalid 'package => {"use strict"}'
            this.errorLocation = this.trackErrorLocation();
            this.flags |= 64 /* HasReservedWord */;
        }
        if (context & 2 /* Strict */) {
            // Invalid: '"use strict"; var af = eval => 1;'
            // Invalid: '"use strict"; var af = arguments => 1;'
            if (this.isEvalOrArguments(tokenValue))
                { this.error(103 /* UnexpectedReservedWord */); }
        }
        return this.parseArrowExpression(context |= (128 /* Arrow */ | 64 /* SimpleArrow */), pos, [expr]);
    }
    return expr;
};
Parser.prototype.parsePrimaryExpression = function parsePrimaryExpression (context, pos) {
    switch (this.token) {
        case 1051189 /* Divide */:
        case 524325 /* DivideAssign */:
            switch (this.scanRegularExpression()) {
                case 4 /* RegularExpression */:
                    return this.parseRegularExpression(context);
                default: // ignore
            }
        case 2 /* NumericLiteral */:
            if (this.flags & 524288 /* BigInt */)
                { return this.parseBigIntLiteral(context); }
        case 3 /* StringLiteral */:
            return this.parseLiteral(context);
        case 12382 /* ThisKeyword */:
            return this.parseThisExpression(context);
        case 12295 /* NullKeyword */:
            return this.parseNullExpression(context);
        case 12294 /* TrueKeyword */:
            return this.parseTrueExpression(context);
        case 12293 /* FalseKeyword */:
            return this.parseFalseExpression(context);
        case 11 /* LeftParen */:
            return this.parseParenthesizedExpression(context & ~2048 /* Await */ | (8192 /* AllowIn */ | 1024 /* Parenthesis */), pos);
        case 131091 /* LeftBracket */:
            return this.parseArrayExpression(context);
        case 131084 /* LeftBrace */:
            return this.parseObjectExpression(context);
        case 12375 /* FunctionKeyword */:
            return this.parseFunctionExpression(context);
        case 12378 /* NewKeyword */:
            return this.parseNewExpression(context);
        case 12365 /* ClassKeyword */:
            return this.parseClassExpression(context);
        case 9 /* TemplateTail */:
            return this.parseTemplateTail(context, pos);
        case 8 /* TemplateCont */:
            return this.parseTemplate(context, pos);
        case 12380 /* SuperKeyword */:
            return this.parseSuper(context);
        case 12369 /* DoKeyword */:
            if (this.flags & 1073741824 /* OptionsV8 */)
                { return this.parseDoExpression(context); }
        case 65644 /* AsyncKeyword */:
            if (this.flags & 131072 /* HasUnicode */)
                { this.error(88 /* InvalidEscapedReservedWord */); }
            if (this.nextTokenIsFunctionKeyword(context))
                { return this.parseFunctionExpression(context); }
            if (this.flags & 32768 /* Arrow */)
                { this.flags &= ~32768 /* Arrow */; }
            pos = this.getLocations();
            // 'async' could be an plain identifier, so we can't "expect" anything
            var expr = this.parseIdentifier(context);
            var token = this.token;
            var tokenValue = this.tokenValue;
            // Fast path in case linebreak after async. In that case this is an
            // plain identifier
            if (this.flags & 1 /* LineTerminator */)
                { return expr; }
            // Valid: 'async => 1'
            if (this.token === 10 /* Arrow */)
                { return this.parseArrowExpression(context & ~1024 /* Parenthesis */, pos, [expr]); }
            // Invalid: 'async => {}'
            // Valid: 'async foo => {}'
            if (this.isIdentifier(context, this.token)) {
                // Invalid: '(async await => 1);'
                if (token === 2162797 /* AwaitKeyword */)
                    { this.error(1 /* UnexpectedToken */, tokenDesc(token)); }
                if (context & 2 /* Strict */) {
                    // Invalid: '"use strict"; (async eval => 1);'
                    // Invalid: '"use strict"; (async arguments => 1);'
                    if (this.isEvalOrArguments(tokenValue))
                        { this.error(103 /* UnexpectedReservedWord */); }
                }
                expr = this.parseIdentifier(context);
                // Valid: 'async foo => {}'
                if (this.token === 10 /* Arrow */)
                    { return this.parseArrowExpression(context & ~1024 /* Parenthesis */ | 2048 /* Await */, pos, [expr]); }
                // Invalid: 'async foo 7 {}'
                // Invalid: 'async foo bar {}'
                // Invalid: 'foo / {}'
                this.error(1 /* UnexpectedToken */, tokenDesc(this.token));
            }
            this.flags |= 65536 /* AsyncArrow */;
            // Return identifier
            return expr;
        // Invalid: `(async function *() { void yield; });`
        case 20586 /* YieldKeyword */:
            if (context & 4096 /* Yield */)
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
        case 4214856 /* LetKeyword */:
            // Invalid: '"use strict"; let instanceof Foo'
            // Invalid: '"use strict"; let:0;'
            // Invalid: '"use strict"; for (x of let) {}'
            if (context & 2 /* Strict */)
                { this.error(118 /* InvalidStrictExpPostion */, this.tokenValue); }
            // fixes let let split across two lines
            if (this.flags & 1 /* LineTerminator */)
                { this.error(119 /* InvalidStrictLexical */); }
        default:
            return this.parseIdentifierOrArrow(context & ~1024 /* Parenthesis */, pos);
    }
};
Parser.prototype.parseTemplateTail = function parseTemplateTail (context, pos) {
    var quasis = this.parseTemplateElement(context, pos);
    return this.finishNode(pos, {
        type: 'TemplateLiteral',
        expressions: [],
        quasis: [quasis]
    });
};
Parser.prototype.parseTemplateHead = function parseTemplateHead (context, cooked, raw) {
    var pos = this.getLocations();
    this.token = this.scanTemplateNext(context);
    return this.finishNode(pos, {
        type: 'TemplateElement',
        value: {
            cooked: cooked,
            raw: raw
        },
        tail: false
    });
};
Parser.prototype.parseTemplateElement = function parseTemplateElement (context, pos) {
    var cooked = this.tokenValue;
    var raw = this.tokenRaw;
    this.expect(context, 9 /* TemplateTail */);
    return this.finishNode(pos, {
        type: 'TemplateElement',
        value: {
            cooked: cooked,
            raw: raw
        },
        tail: true
    });
};
Parser.prototype.parseTaggedTemplateExpression = function parseTaggedTemplateExpression (context, expr, quasi, pos) {
    return this.finishNode(pos, {
        type: 'TaggedTemplateExpression',
        tag: expr,
        quasi: quasi
    });
};
Parser.prototype.parseTemplate = function parseTemplate (context, pos) {
        var this$1 = this;

    var expressions = [];
    var quasis = [];
    while (this.token === 8 /* TemplateCont */) {
        if (this$1.token === 15 /* RightBrace */)
            { this$1.error(1 /* UnexpectedToken */, tokenDesc(this$1.token)); }
        var cooked = this$1.tokenValue;
        var raw = this$1.tokenRaw;
        this$1.expect(context, 8 /* TemplateCont */);
        expressions.push(this$1.parseExpression(context));
        quasis.push(this$1.parseTemplateHead(context, cooked, raw));
    }
    while (this.token === 9 /* TemplateTail */) {
        quasis.push(this$1.parseTemplateElement(context, pos));
    }
    return this.finishNode(pos, {
        type: 'TemplateLiteral',
        expressions: expressions,
        quasis: quasis
    });
};
Parser.prototype.parseClassDeclaration = function parseClassDeclaration (context) {
    var pos = this.getLocations();
    this.expect(context, 12365 /* ClassKeyword */);
    var id = null;
    if (this.isIdentifier(context, this.token)) {
        var name = this.tokenValue;
        if (context & 8 /* Statement */) {
            if (!this.initBlockScope() && name in this.blockScope) {
                if (this.blockScope !== this.functionScope || this.blockScope[name] === 2 /* NonShadowable */) {
                    this.error(92 /* DuplicateIdentifier */, name);
                }
            }
            this.blockScope[name] = 1 /* Shadowable */;
        }
        // Invalid: 'export class a{}  export class a{}'
        if (context & 33554432 /* Export */ && this.token === 131073 /* Identifier */)
            { this.addFunctionArg(this.tokenValue); }
        id = this.parseBindingIdentifier(context | 2 /* Strict */);
        // Valid: `export default class {};`
        // Invalid: `class {};`
    }
    else if (!(context & 65536 /* OptionalIdentifier */)) {
        this.error(116 /* UnNamedClassStmt */);
    }
    var superClass = null;
    if (this.parseOptional(context, 12372 /* ExtendsKeyword */)) {
        superClass = this.parseLeftHandSideExpression(context |= (262144 /* Super */ | 2 /* Strict */), pos);
    }
    var classBody = this.parseClassBody(context | 2 /* Strict */);
    return this.finishNode(pos, {
        type: 'ClassDeclaration',
        id: id,
        superClass: superClass,
        body: classBody
    });
};
Parser.prototype.parseClassExpression = function parseClassExpression (context) {
    var pos = this.getLocations();
    this.expect(context, 12365 /* ClassKeyword */);
    // In ES6 specification, All parts of a ClassDeclaration or a ClassExpression are strict mode code
    var id = this.isIdentifier(context, this.token) ? this.parseIdentifier(context | 2 /* Strict */) : null;
    var superClass = null;
    if (this.parseOptional(context, 12372 /* ExtendsKeyword */)) {
        superClass = this.parseLeftHandSideExpression(context |= (2 /* Strict */ | 262144 /* Super */), pos);
    }
    var classBody = this.parseClassBody(context);
    return this.finishNode(pos, {
        type: 'ClassExpression',
        id: id,
        superClass: superClass,
        body: classBody
    });
};
Parser.prototype.parseClassElementList = function parseClassElementList (context) {
        var this$1 = this;

    this.expect(context, 131084 /* LeftBrace */);
    var body = [];
    while (this.token !== 15 /* RightBrace */) {
        if (!this$1.parseOptional(context, 17 /* Semicolon */)) {
            var node = this$1.parseClassElement(context & ~65536 /* OptionalIdentifier */);
            body.push(node);
            if (node.kind === 'constructor')
                { context |= 32 /* HasConstructor */; }
        }
    }
    this.expect(context, 15 /* RightBrace */);
    return body;
};
Parser.prototype.parseClassBody = function parseClassBody (context) {
    var pos = this.getLocations();
    var elementList = this.parseClassElementList(context);
    return this.finishNode(pos, {
        type: 'ClassBody',
        body: elementList,
    });
};
Parser.prototype.parseClassElement = function parseClassElement (context) {
    var pos = this.getLocations();
    var flags = 0;
    var lastFlag = 0;
    var count = 0;
    var key;
    if (this.parseOptional(context, 20585 /* StaticKeyword */)) {
        flags |= lastFlag = 4 /* Static */;
        count++;
    }
    if (this.parseOptional(context &= ~2 /* Strict */, 65647 /* GetKeyword */)) {
        flags |= lastFlag = 1 /* Getter */;
        count++;
    }
    else if (this.parseOptional(context &= ~2 /* Strict */, 65648 /* SetKeyword */)) {
        flags |= lastFlag = 2 /* Setter */;
        count++;
    }
    else if (this.parseOptional(context, 65644 /* AsyncKeyword */)) {
        // Invalid:  "class A {async\nfoo() { }}"
        if (this.flags & 1 /* LineTerminator */)
            { this.error(87 /* LineBreakAfterAsync */); }
        flags |= lastFlag = 16 /* Async */;
        count++;
    }
    if (this.parseOptional(context, 1051187 /* Multiply */)) {
        if (flags & 16 /* Async */) {
            if (!(this.flags & 134217728 /* OptionsNext */))
                { this.error(63 /* NotAnAsyncGenerator */); }
        }
        flags |= lastFlag = 64 /* Generator */;
    }
    switch (this.token) {
        // 'abc
        case 131073 /* Identifier */:
            if (this.tokenValue === 'constructor')
                { flags |= 8 /* Constructor */; }
            key = this.parseIdentifier(context);
            break;
        // 'constructor'
        case 65646 /* ConstructorKeyword */:
            if (this.tokenValue === 'constructor')
                { flags |= 8 /* Constructor */; }
            key = this.parseIdentifier(context &= ~2 /* Strict */);
            break;
        // '"abc"', '123'
        case 2 /* NumericLiteral */:
        case 3 /* StringLiteral */:
            if (this.tokenValue === 'constructor')
                { flags |= 8 /* Constructor */; }
            key = this.parseLiteral(context &= ~2 /* Strict */);
            break;
        case 131091 /* LeftBracket */:
            flags |= 128 /* Computed */;
            key = this.parseComputedPropertyName(context);
            break;
        default:
            if (this.isIdentifier(context, this.token)) {
                key = this.parseIdentifier(context);
            }
            else if (count && lastFlag !== 64 /* Generator */) {
                key = this.finishNode(pos, {
                    type: 'Identifier',
                    name: this.tokenValue
                });
                flags &= ~lastFlag;
                count--;
            }
            else {
                this.error(0 /* Unexpected */);
            }
    }
    if (!(flags & 32 /* Prototype */) && this.tokenValue === 'prototype')
        { flags |= 32 /* Prototype */; }
    if (!key && flags & 64 /* Generator */)
        { this.error(0 /* Unexpected */); }
    if (flags & 4 /* Static */ && !(flags & 128 /* Computed */)) {
        if (flags & 32 /* Prototype */)
            { this.error(78 /* StaticPrototype */); }
        if (flags & 8 /* Constructor */) {
            flags &= ~(8 /* Constructor */);
        }
    }
    if (flags & 8 /* Constructor */) {
        if (flags & 83 /* Special */)
            { this.error(75 /* ConstructorSpecialMethod */); }
        if (context & 32 /* HasConstructor */)
            { this.error(77 /* DuplicateConstructor */); }
    }
    return this.finishNode(pos, {
        type: 'MethodDefinition',
        computed: !!(flags & 128 /* Computed */),
        key: key,
        kind: (flags & 8 /* Constructor */) ? 'constructor' : (flags & 1 /* Getter */) ? 'get' :
            (flags & 2 /* Setter */) ? 'set' : 'method',
        static: !!(flags & 4 /* Static */),
        value: this.parseFunctionMethod(context | 2 /* Strict */, flags)
    });
};
Parser.prototype.parseObjectExpression = function parseObjectExpression (context) {
        var this$1 = this;

    var pos = this.getLocations();
    this.flags &= ~16 /* HasPrototype */;
    if (this.flags & 1024 /* ArgumentList */)
        { this.flags |= 256 /* NonSimpleParameter */; }
    this.expect(context, 131084 /* LeftBrace */);
    var properties = [];
    while (this.token !== 15 /* RightBrace */) {
        properties.push(this$1.parseObjectElement(context));
        if (this$1.token !== 15 /* RightBrace */)
            { this$1.parseOptional(context, 18 /* Comma */); }
    }
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'ObjectExpression',
        properties: properties
    });
};
Parser.prototype.parseObjectElement = function parseObjectElement (context) {
    // Stage 3 proposal - Object rest spread
    if (this.token === 14 /* Ellipsis */) {
        if (!(this.flags & 134217728 /* OptionsNext */))
            { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
        return this.parseSpreadElement(context);
    }
    var pos = this.getLocations();
    var tokenValue = this.tokenValue;
    var token = this.token;
    var flags = 0;
    var lastFlag = 0;
    var count = 0;
    var asyncNewline;
    var key;
    var computed = false;
    var shorthand = false;
    var value;
    var hasUnicode = !!(this.flags & 131072 /* HasUnicode */);
    if (this.token === 65647 /* GetKeyword */) {
        if (hasUnicode)
            { this.error(88 /* InvalidEscapedReservedWord */); }
        this.expect(context, 65647 /* GetKeyword */);
        flags |= lastFlag = 1 /* Getter */;
        count++;
    }
    if (this.token === 65648 /* SetKeyword */) {
        if (hasUnicode)
            { this.error(88 /* InvalidEscapedReservedWord */); }
        this.expect(context, 65648 /* SetKeyword */);
        flags |= lastFlag = 2 /* Setter */;
        count++;
    }
    if (this.token === 65644 /* AsyncKeyword */) {
        if (hasUnicode)
            { this.error(88 /* InvalidEscapedReservedWord */); }
        this.expect(context, 65644 /* AsyncKeyword */);
        flags |= lastFlag = 16 /* Async */;
        asyncNewline = !!(this.flags & 1 /* LineTerminator */);
        count++;
    }
    if (this.token === 1051187 /* Multiply */) {
        if (hasUnicode)
            { this.error(88 /* InvalidEscapedReservedWord */); }
        this.expect(context, 1051187 /* Multiply */);
        // Async generators
        if (flags & 16 /* Async */ && !(this.flags & 134217728 /* OptionsNext */))
            { this.error(63 /* NotAnAsyncGenerator */); }
        flags |= lastFlag = 64 /* Generator */;
        count++;
    }
    switch (this.token) {
        case 131073 /* Identifier */:
            if (asyncNewline)
                { this.error(87 /* LineBreakAfterAsync */); }
            key = this.parseIdentifier(context);
            break;
        case 2162797 /* AwaitKeyword */:
        case 20586 /* YieldKeyword */:
            key = this.parseIdentifier(context);
            break;
        case 2 /* NumericLiteral */:
        case 3 /* StringLiteral */:
            if (asyncNewline)
                { this.error(87 /* LineBreakAfterAsync */); }
            key = this.parseLiteral(context);
            break;
        case 131091 /* LeftBracket */:
            computed = true;
            key = this.parseComputedPropertyName(context);
            break;
        default:
            if (isKeyword(context, this.token)) {
                key = this.parseIdentifier(context);
            }
            else if (count && lastFlag !== 64 /* Generator */) {
                key = this.finishNode(pos, {
                    type: 'Identifier',
                    name: tokenValue
                });
                flags &= ~lastFlag;
                count--;
            }
            else {
                this.error(0 /* Unexpected */);
            }
    }
    if (!key && flags & 64 /* Generator */)
        { this.error(0 /* Unexpected */); }
    if (this.token === 11 /* LeftParen */) {
        return this.finishNode(pos, {
            type: 'Property',
            computed: computed,
            key: key,
            kind: !(flags & 3 /* Modifier */) ? 'init' : (flags & 2 /* Setter */) ? 'set' : 'get',
            method: (flags & 3 /* Modifier */) === 0,
            shorthand: false,
            value: this.parseFunctionMethod(context, flags)
        });
    }
    switch (this.token) {
        // ':'
        case 21 /* Colon */:
            if (flags & 64 /* Generator */)
                { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
            if (tokenValue === '__proto__') {
                if (this.flags & 16 /* HasPrototype */)
                    { this.error(70 /* DuplicateProtoProperty */); }
                this.flags |= 16 /* HasPrototype */;
            }
            this.expect(context, 21 /* Colon */);
            // Invalid: '"use strict"; ({ a: eval }) = obj'
            if (context & 2 /* Strict */) {
                if (this.token === 131073 /* Identifier */ && (this.isEvalOrArguments(this.tokenValue)))
                    { this.error(108 /* UnexpectedStrictReserved */); }
            }
            // Invalid: `async ({a: await}) =>  1`
            if (this.flags & 65536 /* AsyncArrow */ && this.token === 2162797 /* AwaitKeyword */)
                { this.error(108 /* UnexpectedStrictReserved */); }
            value = this.parseAssignmentExpression(context | 8192 /* AllowIn */);
            break;
        // '='
        case 524317 /* Assign */:
            shorthand = true;
            this.expect(context, 524317 /* Assign */);
            // Invalid: 'function*g() { ({yield = 0} = 0); }'
            if (context & 4096 /* Yield */ &&
                this.flags & 4 /* InFunctionBody */ &&
                token === 20586 /* YieldKeyword */)
                { this.error(113 /* DisallowedInContext */, tokenValue); }
            value = this.parseAssignmentPattern(context | 8192 /* AllowIn */, key, pos);
            break;
        default:
            // Invalid: `class A extends yield B { }`
            // Invalid: '({[x]})'
            // Invalid: '({await})'
            if (computed ||
                !this.isIdentifier(context, token) ||
                token === 2162797 /* AwaitKeyword */)
                { this.error(1 /* UnexpectedToken */, tokenDesc(token)); }
            // Invalid: `"use strict"; for ({ eval } of [{}]) ;`
            if (context & 2 /* Strict */ && this.isEvalOrArguments(this.tokenValue))
                { this.error(103 /* UnexpectedReservedWord */); }
            // Invalid: 'function*g() { ({yield}); }'
            if (context & 4096 /* Yield */ &&
                this.flags & 4 /* InFunctionBody */ &&
                context & 1024 /* Parenthesis */ &&
                token === 20586 /* YieldKeyword */)
                { this.error(113 /* DisallowedInContext */, tokenValue); }
            shorthand = true;
            value = key;
    }
    return this.finishNode(pos, {
        type: 'Property',
        computed: computed,
        key: key,
        kind: 'init',
        method: false,
        shorthand: shorthand,
        value: value
    });
};
Parser.prototype.parseFunctionMethod = function parseFunctionMethod (context, flags) {
    var pos = this.getLocations();
    if (context & 4096 /* Yield */)
        { context &= ~4096 /* Yield */; }
    if (!(flags & 1 /* Getter */) && flags & 64 /* Generator */)
        { context |= 4096 /* Yield */; }
    { this.flags |= 16384 /* AllowConstructorWithSupoer */; }
    if (!(context & 32 /* HasConstructor */))
        { this.flags |= 512 /* AllowSuper */; }
    if (flags & 16 /* Async */)
        { context |= 2048 /* Await */; }
    var savedScope = this.enterFunctionScope();
    var savedFlag = this.flags;
    var params = this.parseFormalParameterList(context | 2097152 /* Method */, flags);
    var body = this.parseFunctionBody(context);
    this.flags = savedFlag;
    this.exitFunctionScope(savedScope);
    return this.finishNode(pos, {
        type: 'FunctionExpression',
        id: null,
        params: params,
        body: body,
        generator: !!(flags & 64 /* Generator */),
        async: (flags & 16 /* Async */) !== 0,
        expression: false
    });
};
Parser.prototype.parseRegularExpression = function parseRegularExpression (context) {
    var pos = this.getLocations();
    var regex = this.tokenRegExp;
    var value = this.tokenValue;
    var raw = this.tokenRaw;
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: value,
        regex: regex
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = raw; }
    return node;
};
Parser.prototype.parseBigIntLiteral = function parseBigIntLiteral (context) {
    var pos = this.getLocations();
    var value = this.tokenValue;
    var raw = this.tokenRaw;
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: value,
        bigint: raw
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = raw; }
    return node;
};
Parser.prototype.parseLiteral = function parseLiteral (context) {
    var pos = this.getLocations();
    var value = this.tokenValue;
    var raw = this.tokenRaw;
    if (context & 2 /* Strict */ && this.flags & 262144 /* Noctal */)
        { this.error(0 /* Unexpected */); }
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: value
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = raw; }
    return node;
};
Parser.prototype.parseIdentifier = function parseIdentifier (context) {
    var name = this.tokenValue;
    var pos = this.getLocations();
    if (this.token === 2162797 /* AwaitKeyword */) {
        if (context & 2048 /* Await */ || this.flags & 131072 /* HasUnicode */)
            { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    }
    if (!(this.flags & 4 /* InFunctionBody */) && this.token === 20586 /* YieldKeyword */) {
        if (this.flags & 131072 /* HasUnicode */)
            { this.error(88 /* InvalidEscapedReservedWord */); }
    }
    this.nextToken(context);
    return this.finishNode(pos, {
        type: 'Identifier',
        name: name
    });
};
Parser.prototype.parseFalseExpression = function parseFalseExpression (context) {
    var pos = this.getLocations();
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: false
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = 'false'; }
    return node;
};
Parser.prototype.parseTrueExpression = function parseTrueExpression (context) {
    var pos = this.getLocations();
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: true
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = 'true'; }
    return node;
};
Parser.prototype.parseThisExpression = function parseThisExpression (context) {
    var pos = this.getLocations();
    this.nextToken(context);
    return this.finishNode(pos, {
        type: 'ThisExpression'
    });
};
Parser.prototype.parseNullExpression = function parseNullExpression (context) {
    var pos = this.getLocations();
    this.nextToken(context);
    var node = this.finishNode(pos, {
        type: 'Literal',
        value: null
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = 'null'; }
    return node;
};
/****
 * Scope
 */
// Fast path for catch arguments
Parser.prototype.addCatchArg = function addCatchArg (name, type /* Shadowable */) {
        if ( type === void 0 ) type = 1;

    this.initBlockScope();
    this.blockScope[name] = type;
};
Parser.prototype.initBlockScope = function initBlockScope () {
    if (this.functionScope == null) {
        this.functionScope = Object.create(null);
        this.blockScope = Object.create(this.functionScope);
        this.parentScope = this.blockScope;
    }
    else if (this.blockScope == null) {
        this.blockScope = Object.create(this.parentScope);
        this.parentScope = this.blockScope;
    }
    else {
        return false;
    }
    return true;
};
Parser.prototype.initFunctionScope = function initFunctionScope () {
    if (this.functionScope !== undefined)
        { return false; }
    this.functionScope = Object.create(null);
    this.blockScope = this.functionScope;
    this.parentScope = this.functionScope;
    return true;
};
Parser.prototype.addFunctionArg = function addFunctionArg (name) {
    if (!this.initFunctionScope() && name in this.functionScope)
        { this.error(92 /* DuplicateIdentifier */, name); }
    this.functionScope[name] = 1 /* Shadowable */;
};
Parser.prototype.addVarOrBlock = function addVarOrBlock (context, name) {
    if (context & 201326592 /* Lexical */) {
        this.addBlockName(name);
    }
    else {
        this.addVarName(name);
    }
};
Parser.prototype.addVarName = function addVarName (name) {
    if (!this.initFunctionScope() && this.blockScope !== undefined &&
        this.blockScope[name] === 2 /* NonShadowable */) {
        this.error(92 /* DuplicateIdentifier */, name);
    }
    this.functionScope[name] = 1 /* Shadowable */;
};
Parser.prototype.addBlockName = function addBlockName (name) {
    switch (name) {
        case 'Infinity':
        case 'NaN':
        case 'undefined':
            this.error(92 /* DuplicateIdentifier */, name);
        default: // ignore
    }
    if (!this.initBlockScope() && (
    // Check `var` variables
    this.blockScope[name] === 1 /* Shadowable */ ||
        // Check variables in current block only
        hasOwn.call(this.blockScope, name))) {
        this.error(92 /* DuplicateIdentifier */, name);
    }
    this.blockScope[name] = 2 /* NonShadowable */;
};
Parser.prototype.enterFunctionScope = function enterFunctionScope () {
    var functionScope = this.functionScope;
    var blockScope = this.blockScope;
    var parentScope = this.parentScope;
    this.functionScope = undefined;
    this.blockScope = undefined;
    this.parentScope = undefined;
    return {
        functionScope: functionScope,
        blockScope: blockScope,
        parentScope: parentScope
    };
};
Parser.prototype.exitFunctionScope = function exitFunctionScope (t) {
    this.functionScope = t.functionScope;
    this.blockScope = t.blockScope;
    this.parentScope = t.parentScope;
};
/** V8 */
Parser.prototype.parseDoExpression = function parseDoExpression (context) {
    var pos = this.getLocations();
    this.expect(context, 12369 /* DoKeyword */);
    var body = this.parseBlockStatement(context);
    return this.finishNode(pos, {
        type: 'DoExpression',
        body: body
    });
};
/** JSX */
Parser.prototype.isValidJSXIdentifier = function isValidJSXIdentifier (t) {
    return (t & 131073 /* Identifier */) === 131073 /* Identifier */ || (t & 65536 /* Contextual */) === 65536 /* Contextual */ || (t & 4096 /* Keyword */) === 4096 /* Keyword */;
};
Parser.prototype.parseJSXIdentifier = function parseJSXIdentifier (context) {
    if (!(this.isValidJSXIdentifier(this.token)))
        { this.error(1 /* UnexpectedToken */, tokenDesc(this.token)); }
    var name = this.tokenValue;
    var pos = this.getLocations();
    this.nextToken(context);
    return this.finishNode(pos, {
        type: 'JSXIdentifier',
        name: name
    });
};
Parser.prototype.parseJSXMemberExpression = function parseJSXMemberExpression (context, expr, pos) {
    return this.finishNode(pos, {
        type: 'JSXMemberExpression',
        object: expr,
        property: this.parseJSXIdentifier(context)
    });
};
Parser.prototype.parseJSXElementName = function parseJSXElementName (context) {
        var this$1 = this;

    var pos = this.getLocations();
    this.scanJSXIdentifier(context);
    // Parse in a 'JSXChild' context to avoid edge cases
    // like `<a>= == =</a>` where '>=' will be seen as an
    // punctuator.
    var expression = this.parseJSXIdentifier(context | 16 /* JSXChild */);
    // Namespace
    if (this.token === 21 /* Colon */)
        { return this.parseJSXNamespacedName(context, expression, pos); }
    // Member expression
    while (this.parseOptional(context, 13 /* Period */)) {
        expression = this$1.parseJSXMemberExpression(context, expression, pos);
    }
    return expression;
};
Parser.prototype.parseJSXNamespacedName = function parseJSXNamespacedName (context, namespace, pos) {
    this.expect(context, 21 /* Colon */);
    var name = this.parseJSXIdentifier(context);
    return this.finishNode(pos, {
        type: 'JSXNamespacedName',
        namespace: namespace,
        name: name
    });
};
Parser.prototype.parseJSXSpreadAttribute = function parseJSXSpreadAttribute (context) {
    var pos = this.getLocations();
    this.expect(context, 131084 /* LeftBrace */);
    this.expect(context, 14 /* Ellipsis */);
    var expression = this.parseExpression(context);
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'JSXSpreadAttribute',
        argument: expression
    });
};
Parser.prototype.scanJSXString = function scanJSXString () {
        var this$1 = this;

    var rawStart = this.index;
    var quote = this.nextChar();
    this.advance();
    var ret = '';
    var start = this.index;
    var ch;
    while (ch !== quote) {
        switch (ch) {
            case 13 /* CarriageReturn */:
            case 10 /* LineFeed */:
            case 8232 /* LineSeparator */:
            case 8233 /* ParagraphSeparator */:
                this$1.error(3 /* UnterminatedString */);
            default: // ignore
        }
        this$1.advance();
        ch = this$1.nextChar();
    }
    // check for unterminated string
    if (ch !== quote)
        { this.error(3 /* UnterminatedString */); }
    if (start !== this.index)
        { ret += this.source.slice(start, this.index); }
    this.advance(); // skip the quote
    this.tokenValue = ret;
    // raw
    if (this.flags & 67108864 /* OptionsRaw */)
        { this.tokenRaw = this.source.slice(rawStart, this.index); }
    return 3 /* StringLiteral */;
};
Parser.prototype.scanJSXAttributeValue = function scanJSXAttributeValue (context) {
    this.startPos = this.index;
    this.startColumn = this.column;
    this.startLine = this.line;
    switch (this.nextChar()) {
        case 34 /* DoubleQuote */:
        case 39 /* SingleQuote */:
            return this.scanJSXString();
        default:
            this.nextToken(context);
    }
};
Parser.prototype.parseJSXEmptyExpression = function parseJSXEmptyExpression () {
    // For empty JSX Expressions the 'endPos' need to become
    // the 'startPos' and the other way around
    return this.finishNodeAt(this.endPos, this.startPos, {
        type: 'JSXEmptyExpression'
    });
};
Parser.prototype.parseJSXSpreadChild = function parseJSXSpreadChild (context) {
    var pos = this.getLocations();
    this.expect(context, 14 /* Ellipsis */);
    var expression = this.parseExpression(context);
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'JSXSpreadChild',
        expression: expression
    });
};
Parser.prototype.parseJSXExpressionContainer = function parseJSXExpressionContainer (context) {
    var pos = this.getLocations();
    this.expect(context, 131084 /* LeftBrace */);
    var expression;
    switch (this.token) {
        // '...'
        case 14 /* Ellipsis */:
            return this.parseJSXSpreadChild(context);
        // '}'
        case 15 /* RightBrace */:
            expression = this.parseJSXEmptyExpression();
            break;
        default:
            expression = this.parseAssignmentExpression(context);
    }
    this.token = this.scanJSXToken();
    return this.finishNode(pos, {
        type: 'JSXExpressionContainer',
        expression: expression
    });
};
Parser.prototype.parseJSXExpressionAttribute = function parseJSXExpressionAttribute (context) {
    var pos = this.getLocations();
    this.expect(context, 131084 /* LeftBrace */);
    switch (this.token) {
        case 15 /* RightBrace */:
            this.error(45 /* NonEmptyJSXExpression */);
        case 14 /* Ellipsis */:
            return this.parseJSXSpreadChild(context);
        default: // ignore
    }
    var expression = this.parseAssignmentExpression(context);
    this.expect(context, 15 /* RightBrace */);
    return this.finishNode(pos, {
        type: 'JSXExpressionContainer',
        expression: expression
    });
};
Parser.prototype.parseJSXAttributeName = function parseJSXAttributeName (context) {
    var pos = this.getLocations();
    var identifier = this.parseJSXIdentifier(context);
    if (this.token !== 21 /* Colon */)
        { return identifier; }
    return this.parseJSXNamespacedName(context, identifier, pos);
};
Parser.prototype.parseJSXAttribute = function parseJSXAttribute (context) {
    var pos = this.getLocations();
    var value = null;
    var attrName = this.parseJSXAttributeName(context);
    switch (this.token) {
        case 524317 /* Assign */:
            switch (this.scanJSXAttributeValue(context)) {
                case 3 /* StringLiteral */:
                    value = this.parseLiteral(context);
                    break;
                default:
                    value = this.parseJSXExpressionAttribute(context);
            }
        default: // ignore
    }
    return this.finishNode(pos, {
        type: 'JSXAttribute',
        value: value,
        name: attrName
    });
};
Parser.prototype.parseJSXAttributes = function parseJSXAttributes (context) {
        var this$1 = this;

    var attributes = [];
    loop: while (this.hasNext()) {
        switch (this$1.token) {
            // '/'
            case 1051189 /* Divide */:
            // `>`
            case 1050432 /* GreaterThan */:
                break loop;
            // `{`
            case 131084 /* LeftBrace */:
                attributes.push(this$1.parseJSXSpreadAttribute(context &= ~16 /* JSXChild */));
                break;
            default:
                attributes.push(this$1.parseJSXAttribute(context));
        }
    }
    return attributes;
};
Parser.prototype.scanJSXToken = function scanJSXToken () {
        var this$1 = this;

    // Set 'endPos' and 'startPos' to current index
    this.endPos = this.startPos = this.index;
    if (!this.hasNext())
        { return 0 /* EndOfSource */; }
    var next = this.nextChar();
    if (next === 60 /* LessThan */) {
        this.advance();
        if (!this.consume(47 /* Slash */))
            { return 1050431 /* LessThan */; }
        return 25 /* JSXClose */;
    }
    if (next === 123 /* LeftBrace */) {
        this.advance();
        return 131084 /* LeftBrace */;
    }
    scan: while (this.hasNext()) {
        switch (this$1.nextChar()) {
            case 123 /* LeftBrace */:
            case 60 /* LessThan */:
                break scan;
            default:
                this$1.advance();
        }
    }
    return 131073 /* Identifier */;
};
Parser.prototype.parseJSXOpeningElement = function parseJSXOpeningElement (context) {
    var pos = this.getLocations();
    this.expect(context, 1050431 /* LessThan */);
    var tagName = this.parseJSXElementName(context);
    var attributes = this.parseJSXAttributes(context);
    var selfClosing = this.token === 1051189;
    switch (this.token) {
        case 1050432 /* GreaterThan */:
            this.token = this.scanJSXToken();
            break;
        case 1051189 /* Divide */:
            this.expect(context, 1051189 /* Divide */);
            // Because advance() (called by nextToken() called by expect()) expects
            // there to be a valid token after >, it needs to know whether to
            // look for a standard JS token or an JSX text node
            if (context & 16 /* JSXChild */) {
                this.expect(context, 1050432 /* GreaterThan */);
            }
            else {
                this.token = this.scanJSXToken();
            }
        default: // ignore
    }
    return this.finishNode(pos, {
        type: 'JSXOpeningElement',
        name: tagName,
        attributes: attributes,
        selfClosing: selfClosing
    });
};
Parser.prototype.parseJSXClosingElement = function parseJSXClosingElement (context) {
    var pos = this.getLocations();
    this.expect(context, 25 /* JSXClose */);
    var name = this.parseJSXElementName(context);
    // Because advance() (called by nextToken() called by expect()) expects there
    // to be a valid token after >, it needs to know whether to look for a
    // standard JS token or an JSX text node
    if (context & 16 /* JSXChild */) {
        this.expect(context, 1050432 /* GreaterThan */);
    }
    else {
        this.token = this.scanJSXToken();
    }
    return this.finishNode(pos, {
        type: 'JSXClosingElement',
        name: name
    });
};
Parser.prototype.parseJSXElement = function parseJSXElement (context) {
        var this$1 = this;

    var pos = this.getLocations();
    var children = [];
    var closingElement = null;
    var openingElement = this.parseJSXOpeningElement(context);
    if (!openingElement.selfClosing) {
        loop: while (this.hasNext()) {
            switch (this$1.token) {
                case 25 /* JSXClose */:
                    break loop;
                default:
                    children.push(this$1.parseJSXChild(context | 16 /* JSXChild */));
            }
        }
        closingElement = this.parseJSXClosingElement(context);
        var open = getQualifiedJSXName(openingElement.name);
        var close = getQualifiedJSXName(closingElement.name);
        if (open !== close)
            { this.error(46 /* ExpectedJSXClosingTag */, close); }
    }
    return this.finishNode(pos, {
        type: 'JSXElement',
        children: children,
        openingElement: openingElement,
        closingElement: closingElement,
    });
};
Parser.prototype.parseJSXText = function parseJSXText (context) {
    var pos = this.getLocations();
    var value = this.source.slice(this.startPos, this.index);
    this.token = this.scanJSXToken();
    var node = this.finishNode(pos, {
        type: 'JSXText',
        value: value
    });
    if (this.flags & 67108864 /* OptionsRaw */)
        { node.raw = value; }
    return node;
};
Parser.prototype.parseJSXChild = function parseJSXChild (context) {
    switch (this.token) {
        // 'abc'
        case 131073 /* Identifier */:
            return this.parseJSXText(context);
        // '{'
        case 131084 /* LeftBrace */:
            return this.parseJSXExpressionContainer(context &= ~16 /* JSXChild */);
        // '<'
        case 1050431 /* LessThan */:
            return this.parseJSXElement(context &= ~16 /* JSXChild */);
        default:
            this.error(0 /* Unexpected */);
    }
};

function parseModule(sourceText, options) {
    if ( options === void 0 ) options = {};

    return new Parser(sourceText, options).parseModule(2 /* Strict */ | 1 /* Module */);
}
function parseScript(sourceText, options) {
    if ( options === void 0 ) options = {};

    return new Parser(sourceText, options).parseScript(0 /* None */);
}

exports.parseModule = parseModule;
exports.parseScript = parseScript;

Object.defineProperty(exports, '__esModule', { value: true });

})));