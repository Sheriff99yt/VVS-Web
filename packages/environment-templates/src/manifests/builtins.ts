import type { ProjectEnvironmentManifest } from '../types';
import envPythonConsoleApp from './env.python.console-app.json';
import envPythonCliTool from './env.python.cli-tool.json';
import envPythonDataScript from './env.python.data-script.json';
import envPythonApiService from './env.python.api-service.json';
import envJavascriptBrowserApp from './env.javascript.browser-app.json';
import envJavascriptNodeScript from './env.javascript.node-script.json';
import envJavascriptSpaApp from './env.javascript.spa-app.json';
import envJavascriptDataScript from './env.javascript.data-script.json';
import envJavascriptHttpService from './env.javascript.http-service.json';
import envCppConsoleApp from './env.cpp.console-app.json';
import envCppGameLoop from './env.cpp.game-loop.json';
import envGdscriptGodotGame from './env.gdscript.godot-game.json';
import envRustConsoleApp from './env.rust.console-app.json';
import envCsharpConsoleApp from './env.csharp.console-app.json';

/** Explicit built-in manifests — add new JSON imports here (also auto-discovered at bundle time). */
export const BUILTIN_MANIFEST_SOURCES: ProjectEnvironmentManifest[] = [
  envPythonConsoleApp,
  envPythonCliTool,
  envPythonDataScript,
  envPythonApiService,
  envJavascriptBrowserApp,
  envJavascriptNodeScript,
  envJavascriptSpaApp,
  envJavascriptDataScript,
  envJavascriptHttpService,
  envCppConsoleApp,
  envCppGameLoop,
  envGdscriptGodotGame,
  envRustConsoleApp,
  envCsharpConsoleApp,
] as ProjectEnvironmentManifest[];
