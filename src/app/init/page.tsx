"use client"
import { use, useEffect, useState } from "react";
import service from "@/commons/base/service";
import { Button, Card, Col, Form, Input, message, Row, Space, Typography } from "antd"
import { useRouter } from 'next/navigation'; 

const cardStyle = {

    backgroundColor: '#bbd4f1ff',
};
const formItemLayout = {
    labelCol: { span: 4 },
    wrapperCol: { span: 20 },
};
export default function Init() {
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    useEffect(() => {
        document.title = "初始化";
        service.get("/initProject/isInitialized").then(res => {
            if (res.data) {
                
                messageApi.info("项目已初始化，无需重复执行");
                setTimeout(() => {
                    router.push("/app");
                }, 2000);
            }
        })
    }, [messageApi, router]);
    const [deptForm] = Form.useForm();
    const [userForm] = Form.useForm();
    const [roleForm] = Form.useForm();

    const onCommit = async () => {
        try {
            let deptValidated = false;
            let userValidated = false;
            let roleValidated = false;

            // 验证用户表单

            await userForm.validateFields().then(values => {
                console.log('用户表单验证成功：', values);
                userValidated = true;
            }).catch(errorInfo => {
                console.log('用户表单验证失败：', errorInfo);
            });

            // 验证部门表单
            await deptForm.validateFields().then(values => {
                console.log('部门表单验证成功：', values);
                deptValidated = true;
            }).catch(errorInfo => {
                console.log('部门表单验证失败：', errorInfo);
            });



            // 验证角色表单
            await roleForm.validateFields().then(values => { 

                console.log('角色表单验证成功：', values);
                roleValidated = true;
            }).catch(errorInfo => {
            });

            console.log(deptValidated, userValidated, roleValidated);

            if (deptValidated && userValidated && roleValidated) {
                service.post("/initProject", {
                    user: userForm.getFieldsValue(),
                    department: deptForm.getFieldsValue(),
                    role: roleForm.getFieldsValue()
                }).then(res => {
                    messageApi.success("初始化成功");
                    setTimeout(() => {
                        router.push("/app");
                    }, 1000);
                });
            }

        } catch (error) {
            // 这里的 catch 可能捕获到其他异常
            console.log('操作失败:', error);
            messageApi.error('请检查表单填写是否正确');
        }

    };

    return (
        <div style={{ position: 'relative', height: '100vh' }}>

            {contextHolder}
            <div style={{
                position: 'absolute',
                top: '5%',
                left: '50%',
                minWidth: '500px',
                maxWidth: '700px',
                transform: 'translate(-50%, 0)'
            }}>
                <Typography.Title level={3}>
                    初始化项目
                </Typography.Title>
                <Card title="部门设置" style={cardStyle}>
                    <Form form={deptForm} {...formItemLayout}>
                        <Form.Item label="部门名称" name={"name"} required rules={[{required:true,message:'请输入部门名称'}]}>
                            <Input placeholder="请输入部门名称" />
                        </Form.Item>
                    </Form>
                </Card>
                <Card title="用户设置" style={cardStyle}>
                    <Form form={userForm} {...formItemLayout}>
                        <Form.Item label="姓名" name={"name"} rules={[{required:true,message:'请输入姓名'}]}>
                            <Input placeholder="请输入用户姓名" />
                        </Form.Item>
                        <Form.Item label="登陆名" name={"userName"} rules={[{required:true,message:'请输入登录名'}]}>
                            <Input placeholder="请输入登陆名" />
                        </Form.Item>
                        <Form.Item label="密码" name={"password"} rules={[{required:true,message:'请输入密码'}]}>
                            <Input.Password placeholder="请输入密码" />
                        </Form.Item>
                        <Form.Item label="确认密码" name={"confirmPassword"} required rules={[{
                            validator: (rule, value) => {
                               if (value !== userForm.getFieldValue('password')) {
                                    return Promise.reject('密码不一致')
                                } else {
                                    return Promise.resolve();
                                }
                            }
                        },{required:true,message:'请确认密码'}]}>
                            <Input.Password placeholder="请输入确认密码" />
                        </Form.Item>
                        <Form.Item label="邮箱" name={"email"} rules={[{ type: "email", message: '请输入正确的邮箱' },{required:true,message:'请输入邮箱'}]} required>
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>
                    </Form>
                </Card>
                <Card title="角色设置" style={cardStyle}>
                    <Form form={roleForm} {...formItemLayout}>
                        <Form.Item label="角色名称" name={"name"} rules={[{required:true,message:'请输入角色名称'}]}>
                            <Input placeholder="请输入角色名称" />
                        </Form.Item>
                    </Form>
                </Card>
                <br />
                <Row>
                    <Col span={4} offset={20}>
                        <Space>

                            <Button type="primary" onClick={() => { onCommit() }}>提交</Button>
                        </Space>
                    </Col>
                </Row>
            </div>
        </div>
    )
}