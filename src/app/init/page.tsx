"use client"
import { useEffect, useState } from "react";
import service from "@/commons/base/service";
import { Alert, Button, Card, Col, Form, Input, message, Row, Space, Typography } from "antd"
import { useRouter } from 'next/navigation';

const cardStyle = {
    backgroundColor: '#bbd4f1ff',
};
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

type InitMode = "loading" | "fresh" | "existing" | "done";

/**
 * 初始化页面，支持两种模式：
 * - fresh：全新安装，创建租户、顶级部门、管理员并配置 Keycloak；
 * - existing：数据库已有租户但缺少 Keycloak 配置，只补充 Keycloak 设置并复用现有数字 ID。
 */
export default function Init() {
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const [deptForm] = Form.useForm();
    const [userForm] = Form.useForm();
    const [keycloakForm] = Form.useForm();
    const [mode, setMode] = useState<InitMode>("loading");

    useEffect(() => {
        document.title = "初始化";
        Promise.all([
            service.get<boolean>("/initProject/isInitialized"),
            service.get<{ configured: boolean }>("/initProject/keycloakStatus"),
        ]).then(([initializedResponse, keycloakStatusResponse]) => {
            const initialized = !!initializedResponse.data;
            const keycloakConfigured = !!keycloakStatusResponse.data?.configured;
            if (initialized && keycloakConfigured) {
                setMode("done");
                messageApi.info("项目已初始化，无需重复执行");
                setTimeout(() => router.push("/app"), 2000);
                return;
            }
            setMode(initialized ? "existing" : "fresh");
        }).catch(() => setMode("fresh"));
    }, [messageApi, router]);

    useEffect(() => {
        keycloakForm.setFieldsValue({
            redirectUri: `${window.location.origin}/server/login/oauth2/code/keycloak`,
            postLogoutRedirectUri: `${window.location.origin}/app`,
        });
    }, [keycloakForm]);

    const onCommit = async () => {
        try {
            const [user, keycloak] = await Promise.all([
                userForm.validateFields(),
                keycloakForm.validateFields(),
            ]);
            if (mode === "existing") {
                await service.post("/initProject", { user, keycloak });
            } else {
                const department = await deptForm.validateFields();
                await service.post("/initProject", { user, department, keycloak });
            }
            messageApi.success("初始化成功");
            setTimeout(() => router.push("/app"), 1000);
        } catch (error) {
            if (!error || typeof error !== "object" || !("errorFields" in error)) {
                messageApi.error("初始化失败，请检查 Keycloak 连接信息和管理客户端权限");
            }
        }
    };

    if (mode === "loading") {
        return (
            <div style={{ padding: 40 }}>
                {contextHolder}
                <Typography.Text>正在检查初始化状态...</Typography.Text>
            </div>
        );
    }

    if (mode === "done") {
        return (
            <div style={{ padding: 40 }}>
                {contextHolder}
                <Typography.Title level={3}>项目已初始化，正在跳转...</Typography.Title>
            </div>
        );
    }

    const existingInstallation = mode === "existing";

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
                    {existingInstallation ? "补充 Keycloak 配置" : "初始化项目"}
                </Typography.Title>
                {existingInstallation && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="检测到已有业务数据，但尚未配置 Keycloak"
                        description="本次只补充 Keycloak 配置，并绑定现有租户、根部门和管理员数字 ID；不会创建新租户，也不会修改现有部门与工作流数据。管理员密码仅在新创建 Keycloak 用户时生效。"
                    />
                )}
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
                {!existingInstallation && (
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
                )}
                <Card title={existingInstallation ? "管理员（绑定 Keycloak 用户）" : "管理员（写入 Keycloak 用户）"} style={cardStyle}>
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
