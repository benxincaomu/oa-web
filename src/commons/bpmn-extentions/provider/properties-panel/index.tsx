// ... existing code ...
import BpmnModeler from 'camunda-bpmn-js/lib/base/Modeler';
import PropertiesView from "./PropertiesPanel";
import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import { createRoot ,hydrateRoot} from 'react-dom/client';
interface PropertiesPanelProps {
    container: HTMLDivElement;
    bpmnModelerRef: React.RefObject<BpmnModeler | null>;
}
class PropertiesPanel {

    private root: ReturnType<typeof createRoot> | null = null;

    constructor({ container, bpmnModelerRef }: PropertiesPanelProps) {
        // 检查容器上是否已经存在根节点
        if (!container.hasOwnProperty('_reactRootContainer')) {
            this.root = createRoot(container);
            (container as any)._reactRootContainer = this.root;
        } else {
            this.root = (container as any)._reactRootContainer;
        }
        this.root!.render(<PropertiesView bpmnModelerRef={bpmnModelerRef} />);
        
    }

    // 添加销毁方法以正确清理
    destroy() {
        if (this.root) {
            this.root.unmount();
            this.root = null;
        }
    }
};
export default PropertiesPanel;