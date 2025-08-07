"use client"
import BpmnModeler from 'camunda-bpmn-js/lib/base/Modeler';

import React, { useEffect } from 'react';
import { Tabs, Space } from 'antd';
import { CollapseProps, Collapse, } from 'antd';
import { Mode } from 'fs';
import ModelerProps from './ModelerProps';
import GeneralPropertiesView from './GeneralPropertiesView';
import Selection from 'diagram-js/lib/features/selection/Selection';

export default function EndEventPropertiesView({ bpmnModelerRef,bpmnId }: ModelerProps) {

    useEffect(() => {
        const modeler = bpmnModelerRef.current;
        if (modeler) {
            const selection:Selection = modeler.get('selection');
            selection.get();
        }
    }, []);
    const items: CollapseProps['items'] = [
        {
            key: '1',
            label: '通用属性',
            children: <GeneralPropertiesView bpmnModelerRef={bpmnModelerRef} bpmnId={bpmnId}/>,
        },
    ];


    return (
        <div className="properties-panel">
            <Space direction="horizontal">
                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M15.84.042C8.654-.01 1.913 5.437.4 12.454-1.057 18.62 1.554 25.495 6.784 29.09c5.076 3.636 12.31 3.92 17.59.544 5.309-3.251 8.435-9.744 7.445-15.921C30.91 7.307 25.795 1.738 19.442.422a16.064 16.064 0 00-3.602-.38zm.382 5.01c5.28-.017 10.13 4.353 10.669 9.61.687 5.025-2.552 10.281-7.423 11.792-4.754 1.617-10.486-.447-12.962-4.856-2.74-4.575-1.574-11.094 2.768-14.27a11.05 11.05 0 016.948-2.276z"></path></svg>
                <span>结束事件</span>
            </Space>
            <Collapse items={items} />

        </div>
    )
}