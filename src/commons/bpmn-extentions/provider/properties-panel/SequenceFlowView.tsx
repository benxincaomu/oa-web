"use client"
import BpmnModeler from 'camunda-bpmn-js/lib/base/Modeler';
import Selection from 'diagram-js/lib/features/selection/Selection';

import React, { useEffect } from 'react';
import { Space } from 'antd';
import { CollapseProps, Collapse, } from 'antd';
import ModelerProps from './ModelerProps';
import GeneralPropertiesView from './GeneralPropertiesView';
import Modeling from 'bpmn-js/lib/features/modeling/Modeling';
import FlowConditionView from './FlowConditionView';
import { Moddle } from 'bpmn-js/lib/model/Types';

export default function SequenceFlowPropertiesView({ bpmnModelerRef, bpmnId }: ModelerProps) {
    const [items, setItems] = React.useState<CollapseProps['items']>([]);
    // const [bpmnId, setBpmnId] = React.useState('');


    useEffect(() => {
        const modeler = bpmnModelerRef.current;
        if (modeler) {
            const selection: Selection = modeler.get('selection');
            const modeling: Modeling = modeler.get('modeling');
            const selectedElements = selection.get();
            // console.log(sourceElement);
            if (selectedElements.length > 0 && selectedElements[0].type === 'bpmn:SequenceFlow') {
                const sourceElement = selectedElements[0].source;
                let itemsTmp: CollapseProps['items'] = [
                    {
                        key: '1',
                        label: '通用属性',
                        children: <GeneralPropertiesView bpmnModelerRef={bpmnModelerRef} bpmnId={bpmnId} />,
                    }
                ];
                if (sourceElement.type === 'bpmn:ParallelGateway' || sourceElement.type === 'bpmn:ExclusiveGateway' || sourceElement.type === 'bpmn:EventBasedGateway') {
                    itemsTmp = [
                        {
                            key: '1',
                            label: '通用属性',
                            children: <GeneralPropertiesView bpmnModelerRef={bpmnModelerRef} bpmnId={bpmnId} />,
                        }, {
                            key: '2',
                            label: '条件',
                            children: <FlowConditionView bpmnModelerRef={bpmnModelerRef} bpmnId={bpmnId} />,
                        }
                    ];

                } else if (sourceElement.type === 'bpmn:UserTask') {
                    // 非网关出口，以id为判断条件
                    console.log(selectedElements[0].id);
                    const moddle: Moddle = modeler.get("moddle");
                    const conditionExpression = moddle.create('bpmn:FormalExpression', {
                        body: `\${flowId == "${selectedElements[0].id}"}`
                    });
                    modeling.updateProperties(selectedElements[0], {
                        conditionExpression
                    });
                    console.log(selectedElements[0]);
                }
                setItems(itemsTmp);
            }
        }
    
    }, [bpmnId, bpmnModelerRef]);



return (
    <div className="properties-panel">
        <Space direction="horizontal">
            <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32"><path d="M32 .06S20.33 6.014 14.403 8.798c1.27 1.16 2.451 2.41 3.676 3.616L0 30.734 1.325 32l18.08-18.32c1.227 1.223 2.448 2.453 3.676 3.676C26.247 11.12 32 .06 32 .06z"></path></svg>
            <span>流向</span>
        </Space>
        <Collapse items={items} />

    </div>
)
}