"use client"
import { Form, Input } from "antd";
import ModelerProps from "./ModelerProps";
import { useEffect, useState } from "react";
import Modeling from "bpmn-js/lib/features/modeling/Modeling";
import { Moddle } from "bpmn-js/lib/features/modeling/ElementFactory";
import Selection from 'diagram-js/lib/features/selection/Selection';
import ElementRegistry from "diagram-js/lib/core/ElementRegistry";
import Canvas from "diagram-js/lib/core/Canvas";



export default function FlowConditionView({ bpmnModelerRef, bpmnId }: ModelerProps) {
    const [form] = Form.useForm();
    useEffect(() => {
        const bpmnModeler = bpmnModelerRef.current;
        if (bpmnModeler && bpmnId) {
            const moddle: Moddle = bpmnModeler.get("moddle");
            const selection: Selection = bpmnModeler.get('selection');
            const modeling: Modeling = bpmnModeler.get("modeling");
            const elementRegistry = bpmnModeler.get('elementRegistry') as ElementRegistry;
            const element = elementRegistry.get(bpmnId);
            form.setFieldValue("condition", element?.businessObject.conditionExpression?.body);


        }
    }, [bpmnModelerRef, bpmnId, form]);
    const onConditionChange = (value: string) => {
        console.log('onConditionChange', value);
        const bpmnModeler = bpmnModelerRef.current;
        if (bpmnModeler && value) {
            const moddle: Moddle = bpmnModeler.get("moddle");
            const selection: Selection = bpmnModeler.get('selection');
            const canvas = bpmnModeler.get('canvas') as Canvas;
            const selectedElement = selection.get()[0];
            // console.log('selectedElement', selectedElement);
            const modeling: Modeling = bpmnModeler.get("modeling");
            const conditionExpression = moddle.create('bpmn:FormalExpression', {
                body: value
            });
            modeling.updateProperties(selectedElement, {
                conditionExpression
            });
            
        }
    };

    return (
        <Form form={form}>
            <Form.Item label="spel条件" name="condition" required >
                <Input onChange={(e) => onConditionChange(e.target.value)} />
            </Form.Item>
        </Form>
    )
}