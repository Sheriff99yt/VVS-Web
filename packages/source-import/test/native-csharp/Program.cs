using System.Globalization;
using System.Text.Json;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.Operations;

// Trusted fixture oracle only. Compiled source is never loaded or executed.
if (args.Length != 1) throw new ArgumentException("Pinned reference directory is required.");
var references = Directory.GetFiles(args[0], "*.dll").Order(StringComparer.Ordinal)
    .Select(path => MetadataReference.CreateFromFile(path)).ToArray();
if (references.Length != 164) throw new InvalidOperationException("Pinned reference inventory changed.");
var input = JsonSerializer.Deserialize<FixtureInput>(Console.In.ReadToEnd(), new JsonSerializerOptions { PropertyNameCaseInsensitive = true })
    ?? throw new InvalidOperationException("Missing fixture input.");
var observations = new List<object>();
foreach (var fixture in input.Cases)
{
    var trees = fixture.Files.Select(file => CSharpSyntaxTree.ParseText(file.Source,
        new CSharpParseOptions(LanguageVersion.CSharp12, DocumentationMode.Parse, SourceCodeKind.Regular), file.Path)).ToArray();
    var compilation = CSharpCompilation.Create("NativeFixture", trees, references,
        new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary, optimizationLevel: OptimizationLevel.Release,
            platform: Platform.X64, nullableContextOptions: NullableContextOptions.Enable, checkOverflow: false, allowUnsafe: false));
    using var output = new MemoryStream();
    var emitted = compilation.Emit(output);
    var errors = emitted.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)
        .Select(diagnostic => diagnostic.Id).Distinct().Order(StringComparer.Ordinal).ToArray();
    var syntaxErrors = trees.SelectMany(tree => tree.GetDiagnostics()).Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Error)
        .Select(diagnostic => diagnostic.Id).Distinct().Order(StringComparer.Ordinal).ToArray();
    var declarations = trees.SelectMany(tree => tree.GetRoot().DescendantNodes().OfType<VariableDeclaratorSyntax>())
        .Where(declaration => declaration.Identifier.ValueText == "observed").ToArray();
    if (declarations.Length != 1 || declarations[0].Initializer is null)
        throw new InvalidOperationException($"Fixture {fixture.Id} needs one observed initializer.");
    var declaration = declarations[0];
    var expression = declaration.Initializer!.Value;
    var model = compilation.GetSemanticModel(expression.SyntaxTree);
    var types = model.GetTypeInfo(expression);
    var constant = model.GetConstantValue(expression);
    var conversion = model.GetConversion(expression);
    var calls = new List<object>();
    var effects = new List<object>();
    Walk(model.GetOperation(declaration.Initializer) ?? model.GetOperation(expression), [], calls, effects);
    observations.Add(new {
        id = fixture.Id, ok = emitted.Success, errors, syntaxErrors,
        expressionType = TypeName(types.Type), convertedType = TypeName(types.ConvertedType),
        declaredType = TypeName((model.GetDeclaredSymbol(declaration) as ILocalSymbol)?.Type),
        nullableAnnotation = types.Nullability.Annotation.ToString(), nullableFlow = types.Nullability.FlowState.ToString(),
        constantAvailable = constant.HasValue,
        constantKind = constant.HasValue ? constant.Value?.GetType().Name ?? "null" : null,
        constant = constant.HasValue ? ConstantText(constant.Value) : null,
        operation = model.GetOperation(expression)?.Kind.ToString(), calls, effects,
        conversion = new { implicitConversion = conversion.IsImplicit, userDefined = conversion.IsUserDefined, method = conversion.MethodSymbol?.Name },
        warnings = emitted.Diagnostics.Where(diagnostic => diagnostic.Severity == DiagnosticSeverity.Warning)
            .Select(diagnostic => diagnostic.Id).Distinct().Order(StringComparer.Ordinal).ToArray()
    });
}
Console.Write(JsonSerializer.Serialize(new {
    native = new {
        roslynFileVersion = System.Diagnostics.FileVersionInfo.GetVersionInfo(typeof(CSharpCompilation).Assembly.Location).FileVersion,
        runtime = Environment.Version.ToString(), language = LanguageVersion.CSharp12.ToString(),
        target = Platform.X64.ToString(), nullable = NullableContextOptions.Enable.ToString()
    }, observations
}));

static string? TypeName(ITypeSymbol? type) => type?.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat);
static string ConstantText(object? value) => value switch {
    null => "null",
    bool boolean => boolean ? "true" : "false",
    char character => ((int)character).ToString(CultureInfo.InvariantCulture),
    string text => string.Join(" ", text.Select(character => ((int)character).ToString("X4", CultureInfo.InvariantCulture))),
    float number => number.ToString("R", CultureInfo.InvariantCulture),
    double number => number.ToString("R", CultureInfo.InvariantCulture),
    IFormattable number => number.ToString(null, CultureInfo.InvariantCulture) ?? throw new InvalidOperationException("Missing constant text."),
    _ => throw new InvalidOperationException("Unreviewed constant representation.")
};
static void Walk(IOperation? operation, string[] guards, List<object> calls, List<object> effects)
{
    if (operation is null) return;
    foreach (var child in operation.ChildOperations)
    {
        string? guard = operation switch {
            IBinaryOperation binary when ReferenceEquals(child, binary.RightOperand) && binary.OperatorKind == BinaryOperatorKind.ConditionalAnd => "if-true",
            IBinaryOperation binary when ReferenceEquals(child, binary.RightOperand) && binary.OperatorKind == BinaryOperatorKind.ConditionalOr => "if-false",
            ICoalesceOperation coalesce when ReferenceEquals(child, coalesce.WhenNull) => "if-null",
            IConditionalOperation conditional when ReferenceEquals(child, conditional.WhenTrue) => "if-true",
            IConditionalOperation conditional when ReferenceEquals(child, conditional.WhenFalse) => "if-false",
            _ => null
        };
        Walk(child, guard is null ? guards : [.. guards, guard], calls, effects);
    }
    if (operation is IInvocationOperation invocation) calls.Add(new {
        method = invocation.TargetMethod.Name,
        parameterTypes = invocation.TargetMethod.Parameters.Select(parameter => TypeName(parameter.Type)).ToArray(), guards,
        owner = invocation.TargetMethod.ContainingType.ToDisplayString(SymbolDisplayFormat.CSharpErrorMessageFormat)
    });
    var effect = operation switch {
        IInvocationOperation called => ("invocation", called.TargetMethod),
        IPropertyReferenceOperation property when property.Property.GetMethod is { } getter => ("property-get", getter),
        IBinaryOperation binary when binary.OperatorMethod is { } binaryMethod => ("operator", binaryMethod),
        IConversionOperation converted when converted.OperatorMethod is { } conversionMethod => ("conversion", conversionMethod),
        IObjectCreationOperation created when created.Constructor is { } constructor => ("constructor", constructor),
        _ => ((string, IMethodSymbol)?)null
    };
    if (effect is { } member) effects.Add(new { kind = member.Item1, method = member.Item2.Name, guards });
}

record SourceFile(string Path, string Source);
record Fixture(string Id, SourceFile[] Files);
record FixtureInput(Fixture[] Cases);
