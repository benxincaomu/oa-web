import BpmnModeler from 'camunda-bpmn-js/lib/base/Modeler';
import React from 'react';

export default interface ModelerProps {
    bpmnModelerRef: React.RefObject<BpmnModeler | null>;
    bpmnId?: string;
}