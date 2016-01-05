import { APP_ID, APPLICATION_COMMON_PROVIDERS, AppViewManager, DirectiveResolver, DynamicComponentLoader, Injector, NgZone, Provider, ViewResolver, provide } from 'angular2/core';
import { AnimationBuilder } from 'angular2/src/animate/animation_builder';
import { MockAnimationBuilder } from 'angular2/src/mock/animation_builder_mock';
import { ResolvedMetadataCache } from 'angular2/src/core/linker/resolved_metadata_cache';
import { Reflector, reflector } from 'angular2/src/core/reflection/reflection';
import { IterableDiffers, defaultIterableDiffers, KeyValueDiffers, defaultKeyValueDiffers, ChangeDetectorGenConfig } from 'angular2/src/core/change_detection/change_detection';
import { BaseException, ExceptionHandler } from 'angular2/src/facade/exceptions';
import { PipeResolver } from 'angular2/src/core/linker/pipe_resolver';
import { XHR } from 'angular2/src/compiler/xhr';
import { DOM } from 'angular2/src/platform/dom/dom_adapter';
import { MockDirectiveResolver } from 'angular2/src/mock/directive_resolver_mock';
import { MockViewResolver } from 'angular2/src/mock/view_resolver_mock';
import { MockLocationStrategy } from 'angular2/src/mock/mock_location_strategy';
import { LocationStrategy } from 'angular2/src/router/location_strategy';
import { MockNgZone } from 'angular2/src/mock/ng_zone_mock';
import { TestComponentBuilder } from './test_component_builder';
import { EventManager, EVENT_MANAGER_PLUGINS, ELEMENT_PROBE_PROVIDERS } from 'angular2/platform/common_dom';
import { ListWrapper } from 'angular2/src/facade/collection';
import { FunctionWrapper } from 'angular2/src/facade/lang';
import { RootRenderer } from 'angular2/src/core/render/api';
import { DOCUMENT } from 'angular2/src/platform/dom/dom_tokens';
import { DomRootRenderer, DomRootRenderer_ } from 'angular2/src/platform/dom/dom_renderer';
import { DomSharedStylesHost } from 'angular2/src/platform/dom/shared_styles_host';
import { SharedStylesHost } from 'angular2/src/platform/dom/shared_styles_host';
import { DomEventsPlugin } from 'angular2/src/platform/dom/events/dom_events';
import { Serializer } from "angular2/src/web_workers/shared/serializer";
import { Log } from './utils';
import { COMPILER_PROVIDERS } from 'angular2/src/compiler/compiler';
import { DynamicComponentLoader_ } from "angular2/src/core/linker/dynamic_component_loader";
import { AppViewManager_ } from "angular2/src/core/linker/view_manager";
/**
 * Returns the root injector providers.
 *
 * This must be kept in sync with the _rootBindings in application.js
 *
 * @returns {any[]}
 */
function _getRootProviders() {
    return [provide(Reflector, { useValue: reflector })];
}
/**
 * Returns the application injector providers.
 *
 * This must be kept in sync with _injectorBindings() in application.js
 *
 * @returns {any[]}
 */
function _getAppBindings() {
    var appDoc;
    // The document is only available in browser environment
    try {
        appDoc = DOM.defaultDoc();
    }
    catch (e) {
        appDoc = null;
    }
    return [
        APPLICATION_COMMON_PROVIDERS,
        provide(ChangeDetectorGenConfig, { useValue: new ChangeDetectorGenConfig(true, false, false) }),
        provide(DOCUMENT, { useValue: appDoc }),
        provide(DomRootRenderer, { useClass: DomRootRenderer_ }),
        provide(RootRenderer, { useExisting: DomRootRenderer }),
        provide(APP_ID, { useValue: 'a' }),
        DomSharedStylesHost,
        provide(SharedStylesHost, { useExisting: DomSharedStylesHost }),
        provide(AppViewManager, { useClass: AppViewManager_ }),
        Serializer,
        ELEMENT_PROBE_PROVIDERS,
        ResolvedMetadataCache,
        provide(DirectiveResolver, { useClass: MockDirectiveResolver }),
        provide(ViewResolver, { useClass: MockViewResolver }),
        provide(IterableDiffers, { useValue: defaultIterableDiffers }),
        provide(KeyValueDiffers, { useValue: defaultKeyValueDiffers }),
        Log,
        provide(DynamicComponentLoader, { useClass: DynamicComponentLoader_ }),
        PipeResolver,
        provide(ExceptionHandler, { useValue: new ExceptionHandler(DOM) }),
        provide(LocationStrategy, { useClass: MockLocationStrategy }),
        provide(XHR, { useClass: DOM.getXHR() }),
        TestComponentBuilder,
        provide(NgZone, { useClass: MockNgZone }),
        provide(AnimationBuilder, { useClass: MockAnimationBuilder }),
        EventManager,
        new Provider(EVENT_MANAGER_PLUGINS, { useClass: DomEventsPlugin, multi: true })
    ];
}
function _runtimeCompilerBindings() {
    return [
        provide(XHR, { useClass: DOM.getXHR() }),
        COMPILER_PROVIDERS,
    ];
}
export class TestInjector {
    constructor() {
        this._instantiated = false;
        this._injector = null;
        this._providers = [];
    }
    reset() {
        this._injector = null;
        this._providers = [];
        this._instantiated = false;
    }
    addProviders(providers) {
        if (this._instantiated) {
            throw new BaseException('Cannot add providers after test injector is instantiated');
        }
        this._providers = ListWrapper.concat(this._providers, providers);
    }
    createInjector() {
        var rootInjector = Injector.resolveAndCreate(_getRootProviders());
        this._injector = rootInjector.resolveAndCreateChild(ListWrapper.concat(ListWrapper.concat(_getAppBindings(), _runtimeCompilerBindings()), this._providers));
        this._instantiated = true;
        return this._injector;
    }
    execute(fn) {
        if (!this._instantiated) {
            this.createInjector();
        }
        return fn.execute(this._injector);
    }
}
var _testInjector = null;
export function getTestInjector() {
    if (_testInjector == null) {
        _testInjector = new TestInjector();
    }
    return _testInjector;
}
/**
 * @deprecated Use TestInjector#createInjector() instead.
 */
export function createTestInjector(providers) {
    var rootInjector = Injector.resolveAndCreate(_getRootProviders());
    return rootInjector.resolveAndCreateChild(ListWrapper.concat(_getAppBindings(), providers));
}
/**
 * @deprecated Use TestInjector#createInjector() instead.
 */
export function createTestInjectorWithRuntimeCompiler(providers) {
    return createTestInjector(ListWrapper.concat(_runtimeCompilerBindings(), providers));
}
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`.
 *
 * Example:
 *
 * ```
 * beforeEach(inject([Dependency, AClass], (dep, object) => {
 *   // some code that uses `dep` and `object`
 *   // ...
 * }));
 *
 * it('...', inject([AClass], (object) => {
 *   object.doSomething();
 *   expect(...);
 * })
 * ```
 *
 * Notes:
 * - inject is currently a function because of some Traceur limitation the syntax should
 * eventually
 *   becomes `it('...', @Inject (object: AClass, async: AsyncTestCompleter) => { ... });`
 *
 * @param {Array} tokens
 * @param {Function} fn
 * @return {FunctionWithParamTokens}
 */
export function inject(tokens, fn) {
    return new FunctionWithParamTokens(tokens, fn, false);
}
/**
 * Allows injecting dependencies in `beforeEach()` and `it()`. The test must return
 * a promise which will resolve when all asynchronous activity is complete.
 *
 * Example:
 *
 * ```
 * it('...', injectAsync([AClass], (object) => {
 *   return object.doSomething().then(() => {
 *     expect(...);
 *   });
 * })
 * ```
 *
 * @param {Array} tokens
 * @param {Function} fn
 * @return {FunctionWithParamTokens}
 */
export function injectAsync(tokens, fn) {
    return new FunctionWithParamTokens(tokens, fn, true);
}
export class FunctionWithParamTokens {
    constructor(_tokens, _fn, isAsync) {
        this._tokens = _tokens;
        this._fn = _fn;
        this.isAsync = isAsync;
    }
    /**
     * Returns the value of the executed function.
     */
    execute(injector) {
        var params = this._tokens.map(t => injector.get(t));
        return FunctionWrapper.apply(this._fn, params);
    }
    hasToken(token) { return this._tokens.indexOf(token) > -1; }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidGVzdF9pbmplY3Rvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImFuZ3VsYXIyL3NyYy90ZXN0aW5nL3Rlc3RfaW5qZWN0b3IudHMiXSwibmFtZXMiOlsiX2dldFJvb3RQcm92aWRlcnMiLCJfZ2V0QXBwQmluZGluZ3MiLCJfcnVudGltZUNvbXBpbGVyQmluZGluZ3MiLCJUZXN0SW5qZWN0b3IiLCJUZXN0SW5qZWN0b3IuY29uc3RydWN0b3IiLCJUZXN0SW5qZWN0b3IucmVzZXQiLCJUZXN0SW5qZWN0b3IuYWRkUHJvdmlkZXJzIiwiVGVzdEluamVjdG9yLmNyZWF0ZUluamVjdG9yIiwiVGVzdEluamVjdG9yLmV4ZWN1dGUiLCJnZXRUZXN0SW5qZWN0b3IiLCJjcmVhdGVUZXN0SW5qZWN0b3IiLCJjcmVhdGVUZXN0SW5qZWN0b3JXaXRoUnVudGltZUNvbXBpbGVyIiwiaW5qZWN0IiwiaW5qZWN0QXN5bmMiLCJGdW5jdGlvbldpdGhQYXJhbVRva2VucyIsIkZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zLmNvbnN0cnVjdG9yIiwiRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnMuZXhlY3V0ZSIsIkZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zLmhhc1Rva2VuIl0sIm1hcHBpbmdzIjoiT0FBTyxFQUNMLE1BQU0sRUFDTiw0QkFBNEIsRUFDNUIsY0FBYyxFQUNkLGlCQUFpQixFQUNqQixzQkFBc0IsRUFDdEIsUUFBUSxFQUNSLE1BQU0sRUFFTixRQUFRLEVBQ1IsWUFBWSxFQUNaLE9BQU8sRUFDUixNQUFNLGVBQWU7T0FDZixFQUFDLGdCQUFnQixFQUFDLE1BQU0sd0NBQXdDO09BQ2hFLEVBQUMsb0JBQW9CLEVBQUMsTUFBTSwwQ0FBMEM7T0FFdEUsRUFBQyxxQkFBcUIsRUFBQyxNQUFNLGtEQUFrRDtPQUMvRSxFQUFDLFNBQVMsRUFBRSxTQUFTLEVBQUMsTUFBTSx5Q0FBeUM7T0FDckUsRUFDTCxlQUFlLEVBQ2Ysc0JBQXNCLEVBQ3RCLGVBQWUsRUFDZixzQkFBc0Is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QUNBLE9BQU9BLENBQUNBLE9BQU9BLENBQUNBLEtBQUtBLENBQUNBLEdBQUdBLENBQUNBLENBQUNBLENBQUNBLENBQUNBLENBQUNBO0FBQzVFSCxDQUFDQTtBQUFBIiwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHtcbiAgQVBQX0lELFxuICBBUFBMSUNBVElPTl9DT01NT05fUFJPVklERVJTLFxuICBBcHBWaWV3TWFuYWdlcixcbiAgRGlyZWN0aXZlUmVzb2x2ZXIsXG4gIER5bmFtaWNDb21wb25lbnRMb2FkZXIsXG4gIEluamVjdG9yLFxuICBOZ1pvbmUsXG4gIFJlbmRlcmVyLFxuICBQcm92aWRlcixcbiAgVmlld1Jlc29sdmVyLFxuICBwcm92aWRlXG59IGZyb20gJ2FuZ3VsYXIyL2NvcmUnO1xuaW1wb3J0IHtBbmltYXRpb25CdWlsZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvYW5pbWF0ZS9hbmltYXRpb25fYnVpbGRlcic7XG5pbXBvcnQge01vY2tBbmltYXRpb25CdWlsZGVyfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9hbmltYXRpb25fYnVpbGRlcl9tb2NrJztcblxuaW1wb3J0IHtSZXNvbHZlZE1ldGFkYXRhQ2FjaGV9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci9yZXNvbHZlZF9tZXRhZGF0YV9jYWNoZSc7XG5pbXBvcnQge1JlZmxlY3RvciwgcmVmbGVjdG9yfSBmcm9tICdhbmd1bGFyMi9zcmMvY29yZS9yZWZsZWN0aW9uL3JlZmxlY3Rpb24nO1xuaW1wb3J0IHtcbiAgSXRlcmFibGVEaWZmZXJzLFxuICBkZWZhdWx0SXRlcmFibGVEaWZmZXJzLFxuICBLZXlWYWx1ZURpZmZlcnMsXG4gIGRlZmF1bHRLZXlWYWx1ZURpZmZlcnMsXG4gIENoYW5nZURldGVjdG9yR2VuQ29uZmlnXG59IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb3JlL2NoYW5nZV9kZXRlY3Rpb24vY2hhbmdlX2RldGVjdGlvbic7XG5pbXBvcnQge0Jhc2VFeGNlcHRpb24sIEV4Y2VwdGlvbkhhbmRsZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9mYWNhZGUvZXhjZXB0aW9ucyc7XG5pbXBvcnQge1BpcGVSZXNvbHZlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvbGlua2VyL3BpcGVfcmVzb2x2ZXInO1xuaW1wb3J0IHtYSFJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9jb21waWxlci94aHInO1xuXG5pbXBvcnQge0RPTX0gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fYWRhcHRlcic7XG5cbmltcG9ydCB7TW9ja0RpcmVjdGl2ZVJlc29sdmVyfSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9kaXJlY3RpdmVfcmVzb2x2ZXJfbW9jayc7XG5pbXBvcnQge01vY2tWaWV3UmVzb2x2ZXJ9IGZyb20gJ2FuZ3VsYXIyL3NyYy9tb2NrL3ZpZXdfcmVzb2x2ZXJfbW9jayc7XG5pbXBvcnQge01vY2tMb2NhdGlvblN0cmF0ZWd5fSBmcm9tICdhbmd1bGFyMi9zcmMvbW9jay9tb2NrX2xvY2F0aW9uX3N0cmF0ZWd5JztcbmltcG9ydCB7TG9jYXRpb25TdHJhdGVneX0gZnJvbSAnYW5ndWxhcjIvc3JjL3JvdXRlci9sb2NhdGlvbl9zdHJhdGVneSc7XG5pbXBvcnQge01vY2tOZ1pvbmV9IGZyb20gJ2FuZ3VsYXIyL3NyYy9tb2NrL25nX3pvbmVfbW9jayc7XG5cbmltcG9ydCB7VGVzdENvbXBvbmVudEJ1aWxkZXJ9IGZyb20gJy4vdGVzdF9jb21wb25lbnRfYnVpbGRlcic7XG5cbmltcG9ydCB7XG4gIEV2ZW50TWFuYWdlcixcbiAgRVZFTlRfTUFOQUdFUl9QTFVHSU5TLFxuICBFTEVNRU5UX1BST0JFX1BST1ZJREVSU1xufSBmcm9tICdhbmd1bGFyMi9wbGF0Zm9ybS9jb21tb25fZG9tJztcblxuaW1wb3J0IHtMaXN0V3JhcHBlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2ZhY2FkZS9jb2xsZWN0aW9uJztcbmltcG9ydCB7RnVuY3Rpb25XcmFwcGVyLCBUeXBlfSBmcm9tICdhbmd1bGFyMi9zcmMvZmFjYWRlL2xhbmcnO1xuXG5pbXBvcnQge1Jvb3RSZW5kZXJlcn0gZnJvbSAnYW5ndWxhcjIvc3JjL2NvcmUvcmVuZGVyL2FwaSc7XG5cbmltcG9ydCB7RE9DVU1FTlR9IGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS9kb20vZG9tX3Rva2Vucyc7XG5pbXBvcnQge0RvbVJvb3RSZW5kZXJlciwgRG9tUm9vdFJlbmRlcmVyX30gZnJvbSAnYW5ndWxhcjIvc3JjL3BsYXRmb3JtL2RvbS9kb21fcmVuZGVyZXInO1xuaW1wb3J0IHtEb21TaGFyZWRTdHlsZXNIb3N0fSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL3NoYXJlZF9zdHlsZXNfaG9zdCc7XG5pbXBvcnQge1NoYXJlZFN0eWxlc0hvc3R9IGZyb20gJ2FuZ3VsYXIyL3NyYy9wbGF0Zm9ybS9kb20vc2hhcmVkX3N0eWxlc19ob3N0JztcbmltcG9ydCB7RG9tRXZlbnRzUGx1Z2lufSBmcm9tICdhbmd1bGFyMi9zcmMvcGxhdGZvcm0vZG9tL2V2ZW50cy9kb21fZXZlbnRzJztcblxuaW1wb3J0IHtTZXJpYWxpemVyfSBmcm9tIFwiYW5ndWxhcjIvc3JjL3dlYl93b3JrZXJzL3NoYXJlZC9zZXJpYWxpemVyXCI7XG5pbXBvcnQge0xvZ30gZnJvbSAnLi91dGlscyc7XG5pbXBvcnQge0NPTVBJTEVSX1BST1ZJREVSU30gZnJvbSAnYW5ndWxhcjIvc3JjL2NvbXBpbGVyL2NvbXBpbGVyJztcbmltcG9ydCB7RHluYW1pY0NvbXBvbmVudExvYWRlcl99IGZyb20gXCJhbmd1bGFyMi9zcmMvY29yZS9saW5rZXIvZHluYW1pY19jb21wb25lbnRfbG9hZGVyXCI7XG5pbXBvcnQge0FwcFZpZXdNYW5hZ2VyX30gZnJvbSBcImFuZ3VsYXIyL3NyYy9jb3JlL2xpbmtlci92aWV3X21hbmFnZXJcIjtcblxuLyoqXG4gKiBSZXR1cm5zIHRoZSByb290IGluamVjdG9yIHByb3ZpZGVycy5cbiAqXG4gKiBUaGlzIG11c3QgYmUga2VwdCBpbiBzeW5jIHdpdGggdGhlIF9yb290QmluZGluZ3MgaW4gYXBwbGljYXRpb24uanNcbiAqXG4gKiBAcmV0dXJucyB7YW55W119XG4gKi9cbmZ1bmN0aW9uIF9nZXRSb290UHJvdmlkZXJzKCkge1xuICByZXR1cm4gW3Byb3ZpZGUoUmVmbGVjdG9yLCB7dXNlVmFsdWU6IHJlZmxlY3Rvcn0pXTtcbn1cblxuLyoqXG4gKiBSZXR1cm5zIHRoZSBhcHBsaWNhdGlvbiBpbmplY3RvciBwcm92aWRlcnMuXG4gKlxuICogVGhpcyBtdXN0IGJlIGtlcHQgaW4gc3luYyB3aXRoIF9pbmplY3RvckJpbmRpbmdzKCkgaW4gYXBwbGljYXRpb24uanNcbiAqXG4gKiBAcmV0dXJucyB7YW55W119XG4gKi9cbmZ1bmN0aW9uIF9nZXRBcHBCaW5kaW5ncygpIHtcbiAgdmFyIGFwcERvYztcblxuICAvLyBUaGUgZG9jdW1lbnQgaXMgb25seSBhdmFpbGFibGUgaW4gYnJvd3NlciBlbnZpcm9ubWVudFxuICB0cnkge1xuICAgIGFwcERvYyA9IERPTS5kZWZhdWx0RG9jKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBhcHBEb2MgPSBudWxsO1xuICB9XG5cbiAgcmV0dXJuIFtcbiAgICBBUFBMSUNBVElPTl9DT01NT05fUFJPVklERVJTLFxuICAgIHByb3ZpZGUoQ2hhbmdlRGV0ZWN0b3JHZW5Db25maWcsIHt1c2VWYWx1ZTogbmV3IENoYW5nZURldGVjdG9yR2VuQ29uZmlnKHRydWUsIGZhbHNlLCBmYWxzZSl9KSxcbiAgICBwcm92aWRlKERPQ1VNRU5ULCB7dXNlVmFsdWU6IGFwcERvY30pLFxuICAgIHByb3ZpZGUoRG9tUm9vdFJlbmRlcmVyLCB7dXNlQ2xhc3M6IERvbVJvb3RSZW5kZXJlcl99KSxcbiAgICBwcm92aWRlKFJvb3RSZW5kZXJlciwge3VzZUV4aXN0aW5nOiBEb21Sb290UmVuZGVyZXJ9KSxcbiAgICBwcm92aWRlKEFQUF9JRCwge3VzZVZhbHVlOiAnYSd9KSxcbiAgICBEb21TaGFyZWRTdHlsZXNIb3N0LFxuICAgIHByb3ZpZGUoU2hhcmVkU3R5bGVzSG9zdCwge3VzZUV4aXN0aW5nOiBEb21TaGFyZWRTdHlsZXNIb3N0fSksXG4gICAgcHJvdmlkZShBcHBWaWV3TWFuYWdlciwge3VzZUNsYXNzOiBBcHBWaWV3TWFuYWdlcl99KSxcbiAgICBTZXJpYWxpemVyLFxuICAgIEVMRU1FTlRfUFJPQkVfUFJPVklERVJTLFxuICAgIFJlc29sdmVkTWV0YWRhdGFDYWNoZSxcbiAgICBwcm92aWRlKERpcmVjdGl2ZVJlc29sdmVyLCB7dXNlQ2xhc3M6IE1vY2tEaXJlY3RpdmVSZXNvbHZlcn0pLFxuICAgIHByb3ZpZGUoVmlld1Jlc29sdmVyLCB7dXNlQ2xhc3M6IE1vY2tWaWV3UmVzb2x2ZXJ9KSxcbiAgICBwcm92aWRlKEl0ZXJhYmxlRGlmZmVycywge3VzZVZhbHVlOiBkZWZhdWx0SXRlcmFibGVEaWZmZXJzfSksXG4gICAgcHJvdmlkZShLZXlWYWx1ZURpZmZlcnMsIHt1c2VWYWx1ZTogZGVmYXVsdEtleVZhbHVlRGlmZmVyc30pLFxuICAgIExvZyxcbiAgICBwcm92aWRlKER5bmFtaWNDb21wb25lbnRMb2FkZXIsIHt1c2VDbGFzczogRHluYW1pY0NvbXBvbmVudExvYWRlcl99KSxcbiAgICBQaXBlUmVzb2x2ZXIsXG4gICAgcHJvdmlkZShFeGNlcHRpb25IYW5kbGVyLCB7dXNlVmFsdWU6IG5ldyBFeGNlcHRpb25IYW5kbGVyKERPTSl9KSxcbiAgICBwcm92aWRlKExvY2F0aW9uU3RyYXRlZ3ksIHt1c2VDbGFzczogTW9ja0xvY2F0aW9uU3RyYXRlZ3l9KSxcbiAgICBwcm92aWRlKFhIUiwge3VzZUNsYXNzOiBET00uZ2V0WEhSKCl9KSxcbiAgICBUZXN0Q29tcG9uZW50QnVpbGRlcixcbiAgICBwcm92aWRlKE5nWm9uZSwge3VzZUNsYXNzOiBNb2NrTmdab25lfSksXG4gICAgcHJvdmlkZShBbmltYXRpb25CdWlsZGVyLCB7dXNlQ2xhc3M6IE1vY2tBbmltYXRpb25CdWlsZGVyfSksXG4gICAgRXZlbnRNYW5hZ2VyLFxuICAgIG5ldyBQcm92aWRlcihFVkVOVF9NQU5BR0VSX1BMVUdJTlMsIHt1c2VDbGFzczogRG9tRXZlbnRzUGx1Z2luLCBtdWx0aTogdHJ1ZX0pXG4gIF07XG59XG5cbmZ1bmN0aW9uIF9ydW50aW1lQ29tcGlsZXJCaW5kaW5ncygpIHtcbiAgcmV0dXJuIFtcbiAgICBwcm92aWRlKFhIUiwge3VzZUNsYXNzOiBET00uZ2V0WEhSKCl9KSxcbiAgICBDT01QSUxFUl9QUk9WSURFUlMsXG4gIF07XG59XG5cbmV4cG9ydCBjbGFzcyBUZXN0SW5qZWN0b3Ige1xuICBwcml2YXRlIF9pbnN0YW50aWF0ZWQ6IGJvb2xlYW4gPSBmYWxzZTtcblxuICBwcml2YXRlIF9pbmplY3RvcjogSW5qZWN0b3IgPSBudWxsO1xuXG4gIHByaXZhdGUgX3Byb3ZpZGVyczogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+ID0gW107XG5cbiAgcmVzZXQoKSB7XG4gICAgdGhpcy5faW5qZWN0b3IgPSBudWxsO1xuICAgIHRoaXMuX3Byb3ZpZGVycyA9IFtdO1xuICAgIHRoaXMuX2luc3RhbnRpYXRlZCA9IGZhbHNlO1xuICB9XG5cbiAgYWRkUHJvdmlkZXJzKHByb3ZpZGVyczogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KSB7XG4gICAgaWYgKHRoaXMuX2luc3RhbnRpYXRlZCkge1xuICAgICAgdGhyb3cgbmV3IEJhc2VFeGNlcHRpb24oJ0Nhbm5vdCBhZGQgcHJvdmlkZXJzIGFmdGVyIHRlc3QgaW5qZWN0b3IgaXMgaW5zdGFudGlhdGVkJyk7XG4gICAgfVxuICAgIHRoaXMuX3Byb3ZpZGVycyA9IExpc3RXcmFwcGVyLmNvbmNhdCh0aGlzLl9wcm92aWRlcnMsIHByb3ZpZGVycyk7XG4gIH1cblxuICBjcmVhdGVJbmplY3RvcigpIHtcbiAgICB2YXIgcm9vdEluamVjdG9yID0gSW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZShfZ2V0Um9vdFByb3ZpZGVycygpKTtcbiAgICB0aGlzLl9pbmplY3RvciA9IHJvb3RJbmplY3Rvci5yZXNvbHZlQW5kQ3JlYXRlQ2hpbGQoTGlzdFdyYXBwZXIuY29uY2F0KFxuICAgICAgICBMaXN0V3JhcHBlci5jb25jYXQoX2dldEFwcEJpbmRpbmdzKCksIF9ydW50aW1lQ29tcGlsZXJCaW5kaW5ncygpKSwgdGhpcy5fcHJvdmlkZXJzKSk7XG4gICAgdGhpcy5faW5zdGFudGlhdGVkID0gdHJ1ZTtcbiAgICByZXR1cm4gdGhpcy5faW5qZWN0b3I7XG4gIH1cblxuICBleGVjdXRlKGZuOiBGdW5jdGlvbldpdGhQYXJhbVRva2Vucyk6IGFueSB7XG4gICAgaWYgKCF0aGlzLl9pbnN0YW50aWF0ZWQpIHtcbiAgICAgIHRoaXMuY3JlYXRlSW5qZWN0b3IoKTtcbiAgICB9XG4gICAgcmV0dXJuIGZuLmV4ZWN1dGUodGhpcy5faW5qZWN0b3IpO1xuICB9XG59XG5cbnZhciBfdGVzdEluamVjdG9yOiBUZXN0SW5qZWN0b3IgPSBudWxsO1xuXG5leHBvcnQgZnVuY3Rpb24gZ2V0VGVzdEluamVjdG9yKCkge1xuICBpZiAoX3Rlc3RJbmplY3RvciA9PSBudWxsKSB7XG4gICAgX3Rlc3RJbmplY3RvciA9IG5ldyBUZXN0SW5qZWN0b3IoKTtcbiAgfVxuICByZXR1cm4gX3Rlc3RJbmplY3Rvcjtcbn1cblxuLyoqXG4gKiBAZGVwcmVjYXRlZCBVc2UgVGVzdEluamVjdG9yI2NyZWF0ZUluamVjdG9yKCkgaW5zdGVhZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGNyZWF0ZVRlc3RJbmplY3Rvcihwcm92aWRlcnM6IEFycmF5PFR5cGUgfCBQcm92aWRlciB8IGFueVtdPik6IEluamVjdG9yIHtcbiAgdmFyIHJvb3RJbmplY3RvciA9IEluamVjdG9yLnJlc29sdmVBbmRDcmVhdGUoX2dldFJvb3RQcm92aWRlcnMoKSk7XG4gIHJldHVybiByb290SW5qZWN0b3IucmVzb2x2ZUFuZENyZWF0ZUNoaWxkKExpc3RXcmFwcGVyLmNvbmNhdChfZ2V0QXBwQmluZGluZ3MoKSwgcHJvdmlkZXJzKSk7XG59XG5cbi8qKlxuICogQGRlcHJlY2F0ZWQgVXNlIFRlc3RJbmplY3RvciNjcmVhdGVJbmplY3RvcigpIGluc3RlYWQuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBjcmVhdGVUZXN0SW5qZWN0b3JXaXRoUnVudGltZUNvbXBpbGVyKFxuICAgIHByb3ZpZGVyczogQXJyYXk8VHlwZSB8IFByb3ZpZGVyIHwgYW55W10+KTogSW5qZWN0b3Ige1xuICByZXR1cm4gY3JlYXRlVGVzdEluamVjdG9yKExpc3RXcmFwcGVyLmNvbmNhdChfcnVudGltZUNvbXBpbGVyQmluZGluZ3MoKSwgcHJvdmlkZXJzKSk7XG59XG5cbi8qKlxuICogQWxsb3dzIGluamVjdGluZyBkZXBlbmRlbmNpZXMgaW4gYGJlZm9yZUVhY2goKWAgYW5kIGBpdCgpYC5cbiAqXG4gKiBFeGFtcGxlOlxuICpcbiAqIGBgYFxuICogYmVmb3JlRWFjaChpbmplY3QoW0RlcGVuZGVuY3ksIEFDbGFzc10sIChkZXAsIG9iamVjdCkgPT4ge1xuICogICAvLyBzb21lIGNvZGUgdGhhdCB1c2VzIGBkZXBgIGFuZCBgb2JqZWN0YFxuICogICAvLyAuLi5cbiAqIH0pKTtcbiAqXG4gKiBpdCgnLi4uJywgaW5qZWN0KFtBQ2xhc3NdLCAob2JqZWN0KSA9PiB7XG4gKiAgIG9iamVjdC5kb1NvbWV0aGluZygpO1xuICogICBleHBlY3QoLi4uKTtcbiAqIH0pXG4gKiBgYGBcbiAqXG4gKiBOb3RlczpcbiAqIC0gaW5qZWN0IGlzIGN1cnJlbnRseSBhIGZ1bmN0aW9uIGJlY2F1c2Ugb2Ygc29tZSBUcmFjZXVyIGxpbWl0YXRpb24gdGhlIHN5bnRheCBzaG91bGRcbiAqIGV2ZW50dWFsbHlcbiAqICAgYmVjb21lcyBgaXQoJy4uLicsIEBJbmplY3QgKG9iamVjdDogQUNsYXNzLCBhc3luYzogQXN5bmNUZXN0Q29tcGxldGVyKSA9PiB7IC4uLiB9KTtgXG4gKlxuICogQHBhcmFtIHtBcnJheX0gdG9rZW5zXG4gKiBAcGFyYW0ge0Z1bmN0aW9ufSBmblxuICogQHJldHVybiB7RnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnN9XG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBpbmplY3QodG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnMge1xuICByZXR1cm4gbmV3IEZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zKHRva2VucywgZm4sIGZhbHNlKTtcbn1cblxuLyoqXG4gKiBBbGxvd3MgaW5qZWN0aW5nIGRlcGVuZGVuY2llcyBpbiBgYmVmb3JlRWFjaCgpYCBhbmQgYGl0KClgLiBUaGUgdGVzdCBtdXN0IHJldHVyblxuICogYSBwcm9taXNlIHdoaWNoIHdpbGwgcmVzb2x2ZSB3aGVuIGFsbCBhc3luY2hyb25vdXMgYWN0aXZpdHkgaXMgY29tcGxldGUuXG4gKlxuICogRXhhbXBsZTpcbiAqXG4gKiBgYGBcbiAqIGl0KCcuLi4nLCBpbmplY3RBc3luYyhbQUNsYXNzXSwgKG9iamVjdCkgPT4ge1xuICogICByZXR1cm4gb2JqZWN0LmRvU29tZXRoaW5nKCkudGhlbigoKSA9PiB7XG4gKiAgICAgZXhwZWN0KC4uLik7XG4gKiAgIH0pO1xuICogfSlcbiAqIGBgYFxuICpcbiAqIEBwYXJhbSB7QXJyYXl9IHRva2Vuc1xuICogQHBhcmFtIHtGdW5jdGlvbn0gZm5cbiAqIEByZXR1cm4ge0Z1bmN0aW9uV2l0aFBhcmFtVG9rZW5zfVxuICovXG5leHBvcnQgZnVuY3Rpb24gaW5qZWN0QXN5bmModG9rZW5zOiBhbnlbXSwgZm46IEZ1bmN0aW9uKTogRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnMge1xuICByZXR1cm4gbmV3IEZ1bmN0aW9uV2l0aFBhcmFtVG9rZW5zKHRva2VucywgZm4sIHRydWUpO1xufVxuXG5leHBvcnQgY2xhc3MgRnVuY3Rpb25XaXRoUGFyYW1Ub2tlbnMge1xuICBjb25zdHJ1Y3Rvcihwcml2YXRlIF90b2tlbnM6IGFueVtdLCBwcml2YXRlIF9mbjogRnVuY3Rpb24sIHB1YmxpYyBpc0FzeW5jOiBib29sZWFuKSB7fVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSB2YWx1ZSBvZiB0aGUgZXhlY3V0ZWQgZnVuY3Rpb24uXG4gICAqL1xuICBleGVjdXRlKGluamVjdG9yOiBJbmplY3Rvcik6IGFueSB7XG4gICAgdmFyIHBhcmFtcyA9IHRoaXMuX3Rva2Vucy5tYXAodCA9PiBpbmplY3Rvci5nZXQodCkpO1xuICAgIHJldHVybiBGdW5jdGlvbldyYXBwZXIuYXBwbHkodGhpcy5fZm4sIHBhcmFtcyk7XG4gIH1cblxuICBoYXNUb2tlbih0b2tlbjogYW55KTogYm9vbGVhbiB7IHJldHVybiB0aGlzLl90b2tlbnMuaW5kZXhPZih0b2tlbikgPiAtMTsgfVxufVxuIl19