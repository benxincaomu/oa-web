"use client"
import { Button, Col, Form, Input, Row, Typography, message } from 'antd';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import service from '@/commons/base/service';
import axios from 'axios';
interface ResetPasswordProps {
  resetPasswordId: string;
}
export default function ResetPassword() {
  const [resetPasswordId, setResetPasswordId] = useState('');
  const query = useSearchParams();
  const [form] = Form.useForm();
  const [messageApi, contextHolder] = message.useMessage();
  useEffect(() => {
    setResetPasswordId(query.get('id') || '');
    form.setFieldValue("id", query.get('id'));
  }, [form, query]);
  const router = useRouter();
  const onfFinished = (values: any) => {
    if (values.password !== values.confirmPassword) {
      messageApi.error("密码不一致");
      return;
    }
    axios.post("/user/setPassword", { id: query.get('id'), ...values }).then(res => {
      if (res.data.code == 200) {
        messageApi.success("密码修改成功");
        setTimeout(() => {
          router.push("/app/");
        }, 2000);
      } else {
        messageApi.error(res.data.data);
      }

    });
  };
  return (<>
    {contextHolder}
    <Row>
      <Col span={8}>
      </Col>
      <Col span={8}>
        <Typography.Title level={5}>设置密码</Typography.Title>
      </Col>
    </Row>
    <Row>
      <Col span={8}>
      </Col>
      <Col span={8}>
        <Form onFinish={(values) => onfFinished(values)} form={form}>
          <Form.Item hidden name={"id"}>
            <Input value={resetPasswordId} />
          </Form.Item>
          <Form.Item label="密码" name={'password'} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item label="确认密码" name={'confirmPassword'} rules={[{ required: true }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item wrapperCol={{ offset: 20, span: 4 }}>
            <Button type="primary" htmlType="submit">
              提交
            </Button>
          </Form.Item>
        </Form>
      </Col>
      <Col span={8}>
      </Col>
    </Row>
  </>


  )
}