import { IMPORT_CONTEXT, type ImportContext } from './contracts';
export type ImportGapCategory = 'reverse-mapping' | 'generator-analyzer' | 'core-semantics' | 'language-feature' | 'environment' | 'outside-scope';
export interface ImportCapability {
  id: string; construct: string; context: ImportContext; variant: string; example: string;
  meaning: string; graphEvidence: string; category: ImportGapCategory; blocker: string; roadmapTrack: string; rosettaSeed?: string;
}
const gap = (id: string, construct: string, variant: string, example: string, meaning: string, graphEvidence: string,
  category: ImportGapCategory, blocker: string, roadmapTrack: string, rosettaSeed?: string): ImportCapability => ({
  id, construct, context: IMPORT_CONTEXT, variant, example, meaning, graphEvidence, category, blocker, roadmapTrack, ...(rosettaSeed ? { rosettaSeed } : {}),
});
/** Concrete capability failures; Rosetta seeds discovery, never production parsing. */
export const IMPORT_CAPABILITY_GAPS: readonly ImportCapability[] = [
  gap('RI01','Print','local console call','console.log("x");','Ordered host call and console effect','action_print; Rosetta print.fixture.json','reverse-mapping','No reviewed console receiver/effect mapping','U93 stage 5','print'),
  gap('RI02','If','dynamic truthiness','if (a) { return 1; } else { return 2; }','JS ToBoolean for every input value','flow_branch has data_boolean condition','core-semantics','Unknown parameter is not proof of Boolean; no implicit cast','JS semantic variants','branch'),
  gap('RI03','Assignment','local binding','let x = 1; x = 2;','Lexical local scope and mutable reads','var_define / variable_set; Rosetta assign.fixture.json','core-semantics','Member declarations cannot stand in for lexical locals','U93 stages 4–5','assign'),
  gap('RI04','Call','resolved local function','return helper(a);','Resolve target and preserve ordered argument evaluation','vvs.project.call_function; Rosetta call.fixture.json','reverse-mapping','No function/module binding closure mapping','U93 stage 5','call'),
  gap('RI05','Conversion','explicit String','return String(a);','Native JS String conversion including objects','convert_to_string; Rosetta convert.fixture.json','reverse-mapping','Global identity/shadowing and conversion semantics must be reviewed','U93 stage 5','convert'),
  gap('RI06','Dispatch','receiver call','this.on_ready();','Direct receiver-bound handler call','event_dispatch; Rosetta dispatch.fixture.json','reverse-mapping','No resolved receiver/event role consent mapping','U93 stage 5','dispatch'),
  gap('RI07','Wait','timer callback','setTimeout(callback, 1000);','Host timer scheduling and callback lifetime','action_wait; Rosetta wait.fixture.json','environment','Timer callback is not equivalent to a blocking Wait','Environment integration','wait'),
  gap('RI08','For','iterator','for (const x of xs) { use(x); }','Iterator evaluation, local binding and ordered effects','flow_for; Rosetta for.fixture.json','reverse-mapping','No scope/iteration/effect mapping','U93 stage 5','for'),
  gap('RI09','While','loop','while (a) { use(a); }','Repeated truthiness and ordered effects','flow_while; Rosetta while.fixture.json','reverse-mapping','No loop/effect closure mapping','U93 stage 5','while'),
  gap('RI10','Switch','fallthrough','switch (x) { case 1: use(x); default: done(); }','Strict comparison and fallthrough control','flow_switch; Rosetta switch.fixture.json','core-semantics','Reviewed fallthrough representation required','Control-flow semantics','switch'),
  gap('RI11','Sequence','ordered effects','first(); second();','Execute effects in source order','Exec edges; Rosetta sequence.fixture.json','reverse-mapping','Current blocks accept a single terminal construct','U93 stage 5','sequence'),
  gap('RI12','Import','module binding','import { x } from "m";','Module evaluation, imported binding identity','import_module; Rosetta import_module.fixture.json','outside-scope','Current compilation unit is script/class only','U93 stage 4','import_module'),
  gap('RI13','Await','promise scheduling','await task();','Async continuation, rejection, ordering','action_wait async; Rosetta await_wait.fixture.json','language-feature','No reviewed Promise/async scope mapping','JS async semantics','await_wait'),
  gap('RI14','Native call','external API','host.read();','External receiver and environmental contract','env_native; Rosetta call_native.fixture.json','environment','Import never guesses or resolves external source dependencies','Environment integration','call_native'),
  gap('RI15','Arithmetic','dynamic +','return a + b;','JS ToPrimitive; string concatenation, Number or BigInt','math_add requires data_number inputs','core-semantics','Only provably Number literal trees accepted; no synthetic casts','JS semantic variants'),
  gap('RI16','Arithmetic','dynamic *','return a * b;','JS Number/BigInt conversion and exceptions','math_multiply numeric pins','core-semantics','Unknown operand types cannot claim numeric Math semantics','JS semantic variants'),
  gap('RI17','Literal','negative zero','return -0;','Preserve Number sign through serialization and output','flow_return inline values serialize via JSON','generator-analyzer','Unary mapping absent; JSON would erase literal -0 sign','Numeric fidelity'),
  gap('RI18','String','escaping','return "line\\nnext";','Literal value contains newline','flow_return string inline; generator currently emits unescaped text','generator-analyzer','Generated parse/AST check blocks string escaping drift','Emitter fidelity'),
  gap('RI19','Function','standalone','function f(a) { return a; }','Module lexical scope without invented lifecycle','Function not-in-class support is partial; function tabs are bodies','core-semantics','Reviewed compilation-unit and entry design required','U93 stage 4'),
  gap('RI20','Class','inheritance','class C extends Base {}','Prototype inheritance and constructor effects','class_define extendsType; existing inheritance fixtures','reverse-mapping','No external Base closure or constructor mapping','U93 stage 5'),
  gap('RI21','Comment','embedded trivia','on_start() { /* kept */ return 0; }','Keep comment placement without executable meaning','vvs_comment_node supports author comments','reverse-mapping','Explicit AST trivia attachment rule required','U93 trivia policy'),
  gap('RI22','Directive','strictness','"use strict"; class C {}','Preserve compilation-unit directive and source mode','No explicit directive construct in current importer','core-semantics','File/method directives rejected instead of silently dropped','Module semantics'),
  gap('RI23','Return','comparison','return a === b;','Strict equality and JS value identity','No reviewed reverse comparison mapping','reverse-mapping','Do not rewrite strict/loose operators as generic comparisons','JS semantic variants'),
];
