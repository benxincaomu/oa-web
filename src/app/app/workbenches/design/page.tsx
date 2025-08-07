"use client"

import { useEffect, useState, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import service from '@/commons/base/service';
import { Button, FormInstance, Tabs, message } from 'antd';
import BeanDesign from './BeanDesign';
// import WorkflowDesign from './WorkflowDesign';
import dynamic from 'next/dynamic';
import BpmnModeler from 'camunda-bpmn-js/lib/camunda-platform/Modeler';
// 动态导入 WorkflowDesign 组件并禁用 SSR
const WorkflowDesign = dynamic(() => import('./WorkflowDesign'), { 
  ssr: false,
  loading: () => <div>Loading...</div>
});
const Design = () => {
  const params = useSearchParams();
  const [wid, setWid] = useState<number>(0);
  const [beanForm, setBeanForm] = useState<FormInstance>();
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    if (params) {

      const wid = params.get('wid');
      getWorkbench(Number(wid));
      setWid(Number(wid));
    }
  }, [params]);
  const getWorkbench = (wid: number) => {
    service.get(`/workbench/${wid}`).then((res) => {
      document.title = `流程设计:${res.data.name}`;
    })
  };
  const bpmnModelerRef = useRef<BpmnModeler | null>(null);
  const tabData = [
    /* {
      key: '0',
      label: '枚举设计',
      children: <div>枚举设计</div>,
    }, */
    {
      key: '1',
      label: '实体设计',
      forceRender: true,
      children: <BeanDesign wid={wid} setBeanForm={setBeanForm} />,
    },
    {
      key: '2',
      label: '流程设计',
      forceRender: true,
      children: <WorkflowDesign wid={wid} bpmnModelerRef={bpmnModelerRef} />,
    },
    /*  {
       key: '3',
       label: '页面设计',
       children: <PageDesign wid={wid} />,
     },
     {
       key: '4',
       label: '编辑器',
       children: <PageEditor/>,
     } */
  ];
  const publish = async (event: any) => {
    event.target.disable = true
    const modeler = bpmnModelerRef.current;
    if (modeler) {
      const canvas = modeler.get('canvas');
      let xml = (await modeler.saveXML({ format: true })).xml;
      // 判断xml中是否有isExcution属性
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xml ? xml : "", 'text/xml');
      const processElements = xmlDoc.querySelectorAll('process');
      // 检查每个 process 元素是否包含 isExecutable 属性
      processElements.forEach(element => {
        if (!element.hasAttribute('isExecutable') || element.getAttribute('isExecutable') === 'false') {
          // 加上isExecutable = "true"
          element.setAttribute('isExecutable', 'true');
        }
        // 添加 camunda:historyTimeToLive 属性
        if (!element.hasAttribute('camunda:historyTimeToLive') || element.getAttribute('camunda:historyTimeToLive') !== 'P365D') {
          element.setAttribute('camunda:historyTimeToLive', '');
        }
      });
      const serializer = new XMLSerializer();
      xml = serializer.serializeToString(xmlDoc);

      const beanDefinition = beanForm?.getFieldsValue();
      service.post(`/workbench/publish`, {
        workbenchId: wid,
        workflowDefinition: {
          workbenchId: wid,
          flowDefinition: xml
        },
        entityDefinition: beanDefinition
      }).then(res => {
        messageApi.success('发布成功');
      })

    }
  }


  return (
    <>
      {contextHolder}
      <Tabs defaultActiveKey="1" items={tabData}
        tabBarExtraContent={
          { right: <Button type="primary" onClick={(e) => { publish(e) }}>发布</Button> }
        } />
    </>



  );
};
export default Design;