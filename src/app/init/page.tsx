"use client"
import { useEffect } from "react";
import service from "@/commons/base/service";
import { Button, Card, Col, Form, Input, message, Row, Space, Typography } from "antd"
import { useRouter } from 'next/navigation';

const cardStyle = {
    backgroundColor: '#bbd4f1ff',
};
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

/**
 * 首次初始化：配置 Keycloak，并在 Keycloak 中创建首个管理员与顶级组织。
 * 本地不再保存任何权限/角色数据，基线菜单与接口由后端注册到 Keycloak。
 */
export default function Init() {
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const [deptForm] = Form.useForm();
    const [userForm] = Form.useForm();
    const [keycloakForm] = Form.useForm();

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

    useEffect(() => {
        keycloakForm.setFieldsValue({
            redirectUri: `${window.location.origin}/server/login/oauth2/code/keycloak`,
            postLogoutRedirectUri: `${window.location.origin}/app`,
        });
    }, [keycloakForm]);

    const onCommit = async () => {
        try {
            const [user, department, keycloak] = await Promise.all([
                userForm.validateFields(),
                deptForm.validateFields(),
                keycloakForm.validateFields(),
            ]);
            await service.post("/initProject", { user, department, keycloak });
            messageApi.success("初始化成功");
            setTimeout(() => router.push("/app"), 1000);
        } catch (error) {
            if (!error || typeof error !== "object" || !("errorFields" in error)) {
                messageApi.error("初始化失败，请检查 Keycloak 连接信息和管理客户端权限");
            }
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
                <Card title="Keycloak / OAuth2 / IAM 接入" style={cardStyle}>
                    <Form form={keycloakForm} {...formItemLayout}>
                        <Form.Item label="Issuer URI" name="issuerUri" required rules={[{ required: true, message: "请输入 Keycloak Realm 的 issuer URI" }]}>
                            <Input placeholder="https://keycloak.example.com/realms/company" />
                        </Form.Item>
                        <Form.Item label="Realm" name="realm" required rules={[{ required: true, message: "请输入 Realm 名称" }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="OAuth2 客户端 ID" name="clientId" required rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="OAuth2 客户端密钥" name="clientSecret" required rules={[{ required: true }]}>
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Form.Item label="管理客户端 ID" name="serviceAccountClientId" required rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="管理客户端密钥" name="serviceAccountClientSecret" required rules={[{ required: true }]}>
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                        <Form.Item label="OAuth2 回调地址" name="redirectUri" required rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="退出回调地址" name="postLogoutRedirectUri" required rules={[{ required: true }]}>
                            <Input />
                        </Form.Item>
                        <Form.Item label="Setup token" name="setupToken" required rules={[{ required: true }]}>
                            <Input.Password autoComplete="new-password" />
                        </Form.Item>
                    </Form>
                </Card>
                <Card title="顶级组织（写入 Keycloak 组）" style={cardStyle}>
                    <Form form={deptForm} {...formItemLayout}>
                        <Form.Item label="部门名称" name={"name"} rules={[{ required: true, message: '请输入部门名称' }]}>
                            <Input placeholder="请输入部门名称" />
                        </Form.Item>
                        <Form.Item label="部门编码" name={"code"}>
                            <Input placeholder="可选" />
                        </Form.Item>
                    </Form>
                </Card>
                <Card title="管理员（写入 Keycloak 用户）" style={cardStyle}>
                    <Form form={userForm} {...formItemLayout}>
                        <Form.Item label="姓名" name={"name"} rules={[{ required: true, message: '请输入姓名' }]}>
                            <Input placeholder="请输入用户姓名" />
                        </Form.Item>
                        <Form.Item label="登陆名" name={"userName"} rules={[{ required: true, message: '请输入登录名' }]}>
                            <Input placeholder="请输入登陆名" />
                        </Form.Item>
                        <Form.Item label="密码" name={"password"} rules={[{ required: true, message: '请输入密码' }]}>
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
                        }, { required: true, message: '请确认密码' }]}>
                            <Input.Password placeholder="请输入确认密码" />
                        </Form.Item>
                        <Form.Item label="邮箱" name={"email"} rules={[{ type: "email", message: '请输入正确的邮箱' }, { required: true, message: '请输入邮箱' }]} required>
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>
                        <Form.Item label="手机号" name={"mobile"}>
                            <Input placeholder="可选" />
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
