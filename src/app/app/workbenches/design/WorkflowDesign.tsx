"use client"
import React, { useRef, useEffect, useState } from 'react';
// import BpmnModeler from 'bpmn-js/lib/Modeler';
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler';

import 'camunda-bpmn-js/dist/assets/camunda-platform-modeler.css';

// 引入 BPMN.js 和属性面板所需的基本样式
import 'bpmn-js/dist/assets/diagram-js.css';
import 'bpmn-js/dist/assets/bpmn-js.css';

import 'bpmn-js/dist/assets/bpmn-font/css/bpmn-embedded.css';
import '@bpmn-io/properties-panel/assets/properties-panel.css';



// 如果你需要 Camunda 特有属性，保留这两个导入：
import CamundaModdleExtension from 'camunda-bpmn-moddle/resources/camunda.json';
import { Button, Col, Divider, Row, Space, message } from 'antd';
import PropertiesPanel from '@/commons/bpmn-extentions/provider/properties-panel';
// import zh from 'bpmn-js-i18n/translations/zn';
import zh from '@/commons/bpmn-extentions/translations/zh';

import service from '@/commons/base/service';


// 定义组件的 Props 接口 (现在可以更简单)
interface BpmnModelerComponentProps {
    wid: number,
    onSave?: (xml: string) => void;
    onPublish?: (xml: string) => void;
    bpmnModelerRef: React.RefObject<BpmnModeler | null>;

}
function customTranslate(template:string, replacements:Map<string, string>) {
    replacements = replacements || {};

    // Translate
    template = zh[template] || template;

    // Replace
    return template.replace(/{([^}]+)}/g, function (_, key) {
        return replacements.get(key) || '{' + key + '}';
    });
}

const WorkflowDesign: React.FC<BpmnModelerComponentProps> = ({
    wid, bpmnModelerRef
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const propertiesPanelRef = useRef<HTMLDivElement>(null);


    const customTranslateModule = {
        translate: ['value', customTranslate] // 'zh' is the imported translation dictionary
    };
    const [messageApi, contextHolder] = message.useMessage();


    useEffect(() => {
        if (wid > 0) {
            service.get(`/workflowDefinition/getByWorkbenchId/${wid}`).then((res) => {
                if (res.data) {
                    bpmnModelerRef.current?.importXML(res.data.flowDefinition).catch(err => console.log(err));
                } else {
                    bpmnModelerRef.current?.createDiagram();
                }
            })
        }
    }, [bpmnModelerRef, wid]);
    const [bpmnModeler, setBpmnModeler] = useState<BpmnModeler | null>();

    useEffect(() => {
        if (!containerRef.current || !propertiesPanelRef.current) {
            console.error('BPMN container or properties panel ref is null.');
            return;
        }

        // 确保只初始化一次 Modeler
        if (!bpmnModelerRef.current) {
            const modeler = new BpmnModeler({
                container: containerRef.current,
                height: '78vh',
                // 
                additionalModules: [
                    customTranslateModule,
                ],

            });
            bpmnModelerRef.current = modeler;
            setBpmnModeler(modeler);
            // loadWorkflowDefinition(wid);
            // modeler.createDiagram();
            new PropertiesPanel({
                container: propertiesPanelRef.current,
                bpmnModelerRef
            });
        }

        // 清理函数：在组件卸载时销毁 Modeler 实例
        return () => {
            if (bpmnModelerRef.current) {
                bpmnModelerRef.current.destroy();
                bpmnModelerRef.current = null;
            }
        };
    }, []); // 确保此 useEffect 只在组件挂载时运行一次

    const onSaveXML = () => {
        bpmnModelerRef.current?.saveXML().then(({ xml }) => {
            // console.log(xml);
        });
    };
    const saveBpmn = () => {
        bpmnModelerRef.current?.saveXML().then(({ xml }) => {
            
            // console.log(xml);
            service.post('/workflowDefinition', {
                workbenchId: wid,
                flowDefinition: xml
            }).then(res => {

                messageApi.success('保存成功');

            })
        })
    };

    return (

        <div className='height-100'>
            {contextHolder}
            <Space align='end' >
                <Button type='primary' onClick={() => { saveBpmn(); }}>保存</Button>
                <Button type='primary' danger>清空</Button>
            </Space>
            <div style={{ flexGrow: 1, display: 'flex', height: '100%' }}>
                {/* BPMN 编辑器容器 */}
                <div
                    ref={containerRef}
                    style={{
                        flexGrow: 1,
                        minHeight: 0,     // 允许 flex 布局正确压缩
                        border: '1px solid #ccc',
                    }}
                />

                {/* 属性面板 */}
                <div
                    ref={propertiesPanelRef}
                    style={{
                        width: '280px',
                        borderLeft: '1px solid #ccc',
                        overflowY: 'auto',
                        padding: '10px'
                    }}
                >
                    {/* <PropertiesPanel bpmnModelerRef={bpmnModelerRef} /> */}
                </div>
            </div>
        </div>
    );
};
export default WorkflowDesign;