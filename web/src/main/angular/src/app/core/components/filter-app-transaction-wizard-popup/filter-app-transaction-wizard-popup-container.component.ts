import { Component, OnInit, Input, Output, EventEmitter, AfterViewInit } from '@angular/core';
import { Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

import {
    WindowRefService,
    WebAppSettingDataService,
    UrlRouteManagerService,
    NewUrlStateNotificationService,
    DynamicPopup
} from 'app/shared/services';
import { UrlPathId, UrlQuery, UrlPath } from 'app/shared/models';
import { Filter } from 'app/core/models';
import { FilterParamMaker } from 'app/core/utils/filter-param-maker';
import { HintParamMaker } from 'app/core/utils/hint-param-maker';

@Component({
    selector: 'pp-app-filter-transaction-wizard-popup-container',
    templateUrl: './filter-app-transaction-wizard-popup-container.component.html',
    styleUrls: ['./filter-app-transaction-wizard-popup-container.component.css']
})
export class FilterAppTransactionWizardPopupContainerComponent implements OnInit, AfterViewInit, DynamicPopup {
    @Input() data: any;
    @Output() outCreated = new EventEmitter<ICoordinate>();
    @Output() outClose = new EventEmitter<void>();

    filterInfo$: Observable<Filter>;
    funcImagePath: Function;

    constructor(
        private webAppSettingDataService: WebAppSettingDataService,
        private newUrlStateNotificationService: NewUrlStateNotificationService,
        private urlRouteManagerService: UrlRouteManagerService,
        private windowRefService: WindowRefService,
    ) {}

    ngOnInit() {
        this.funcImagePath = this.webAppSettingDataService.getIconPathMakeFunc();
        this.filterInfo$ = this.newUrlStateNotificationService.onUrlStateChange$.pipe(
            filter((urlService: NewUrlStateNotificationService) => {
                return urlService.hasValue(UrlQuery.FILTER);
            }),
            map((urlService) => {
                const filterInfo = Filter.instanceFromString(urlService.getQueryValue(UrlQuery.FILTER));
                const key = this.data.key;
                return filterInfo.find((f: Filter) => {
                    return `${f.application}^${f.serviceType}` === key;
                });
            }),
            filter((f: Filter) => !!f)
        );
    }

    ngAfterViewInit() {
        this.outCreated.emit({ coordX: 0, coordY: 0 });
    }

    openFilterMapPage(param: any): void {
        const applicationName = param.filterApplicationName;
        const serviceType = param.filterApplicationServiceTypeName;

        const f = new Filter(
            null,
            null,
            null,
            null,
            param.transactionResult,
            applicationName,
            serviceType,
            param.responseFrom,
            param.responseTo
        );

        if (param.urlPattern) {
            f.setUrlPattern(this.windowRefService.nativeWindow.btoa(param.urlPattern));
        }
        if (param.agent) {
            f.setAgentName(param.agent);
        }

        const appKey = `${applicationName}@${serviceType}`;
        const period = this.newUrlStateNotificationService.getPathValue(UrlPathId.PERIOD).getValueWithAddedWords();
        const endTime = this.newUrlStateNotificationService.getPathValue(UrlPathId.END_TIME).getEndTime();
        const currFilterStr = this.newUrlStateNotificationService.hasValue(UrlQuery.FILTER) ? this.newUrlStateNotificationService.getQueryValue(UrlQuery.FILTER) : '';
        const addedFilter = f;
        const currHintStr = this.newUrlStateNotificationService.hasValue(UrlQuery.HINT) ? this.newUrlStateNotificationService.getQueryValue(UrlQuery.HINT) : '';
        const addedHint = null;

        this.urlRouteManagerService.openPage({
            path: [
                UrlPath.FILTERED_MAP,
                appKey,
                period,
                endTime
            ],
            queryParam: {
                filter: FilterParamMaker.makeParam(currFilterStr, addedFilter),
                hint: HintParamMaker.makeParam(currHintStr, addedHint)
            }
        });
    }

    onClosePopup(): void {
        this.outClose.emit();
    }
}
