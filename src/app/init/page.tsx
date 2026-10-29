"use client"
import { useEffect, useState } from "react";
import service from "@/commons/base/service";
import { Alert, Button, Card, Col, Form, Input, Row, Space, Typography, message } from "antd"
import { useRouter } from 'next/navigation';

const cardStyle = {
    backgroundColor: '#bbd4f1ff',
};
const formItemLayout = {
    labelCol: { span: 6 },
    wrapperCol: { span: 18 },
};

interface InitStatus {
    initialized: boolean;
    keycloakConfigured: boolean;
    keycloakLinked: boolean;
}

type InitMode = "loading" | "not-configured" | "fresh" | "existing" | "done";

/**
 * 初始化页面。Keycloak 连接配置来自后端 application.yml / 环境变量（app.keycloak.*），
 * 本页面不再填写 Keycloak 配置，只负责创建/补齐本地租户与管理员的 Keycloak 链接。
 */
export default function Init() {
    const [messageApi, contextHolder] = message.useMessage();
    const router = useRouter();
    const [deptForm] = Form.useForm();
    const [userForm] = Form.useForm();
    const [mode, setMode] = useState<InitMode>("loading");

    useEffect(() => {
        document.title = "初始化";
        service.get<InitStatus>("/initProject/status")
            .then((response) => {
                const status = response.data;
                if (!status.keycloakConfigured) {
                    setMode("not-configured");
                    return;
                }
                if (status.initialized && status.keycloakLinked) {
                    setMode("done");
                    messageApi.info("项目已初始化，无需重复执行");
                    setTimeout(() => router.push("/app"), 2000);
                    return;
                }
                setMode(status.initialized ? "existing" : "fresh");
            })
            .catch(() => messageApi.error("无法读取初始化状态，请检查后端日志"));
    }, [messageApi, router]);

    const onCommit = async () => {
        try {
            const user = await userForm.validateFields();
            if (mode === "existing") {
                await service.post("/initProject", { user });
            } else {
                const department = await deptForm.validateFields();
                await service.post("/initProject", { user, department });
            }
            messageApi.success("初始化成功");
            setTimeout(() => router.push("/app"), 1000);
        } catch (error) {
            if (!error || typeof error !== "object" || !("errorFields" in error)) {
                messageApi.error("初始化失败，请检查 Keycloak 配置和后端日志");
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

    if (mode === "not-configured") {
        return (
            <div style={{ padding: 40 }}>
                {contextHolder}
                <Typography.Title level={3}>Keycloak 尚未配置</Typography.Title>
                <Alert
                    type="error"
                    showIcon
                    message="请先在配置文件中填写 Keycloak 连接信息并重启应用"
                    description={(
                        <div>
                            <p>application.yml 中配置以下内容（或用环境变量覆盖）：</p>
                            <pre style={{ margin: 0 }}>{`app:
  keycloak:
    issuer-uri: ...                     # KEYCLOAK_ISSUER_URI
    realm: ...                          # KEYCLOAK_REALM
    client-id: ...                      # KEYCLOAK_CLIENT_ID
    client-secret: ...                  # KEYCLOAK_CLIENT_SECRET
    service-account-client-id: ...      # KEYCLOAK_SERVICE_ACCOUNT_CLIENT_ID
    service-account-client-secret: ...  # KEYCLOAK_SERVICE_ACCOUNT_CLIENT_SECRET
    redirect-uri: ...                   # KEYCLOAK_REDIRECT_URI
    post-logout-redirect-uri: ...       # KEYCLOAK_POST_LOGOUT_REDIRECT_URI`}</pre>
                            <p style={{ marginBottom: 0 }}>重启应用后刷新本页面，即可继续初始化。</p>
                        </div>
                    )}
                />
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
                    {existingInstallation ? "完成 Keycloak 初始化（已有业务数据）" : "初始化项目"}
                </Typography.Title>
                <Alert
                    type="info"
                    showIcon
                    style={{ marginBottom: 16 }}
                    message="Keycloak 连接配置已从配置文件读取"
                    description="本页面只负责创建/补齐本地租户、管理员数字 ID 与 Keycloak 的链接；Keycloak 连接参数请修改 application.yml 或环境变量（app.keycloak.*）。"
                />
                {existingInstallation && (
                    <Alert
                        type="warning"
                        showIcon
                        style={{ marginBottom: 16 }}
                        message="检测到已有业务数据，但 Keycloak 链接尚未建立"
                        description="本次只补齐管理员、根部门、管理员角色与 Keycloak 的链接，并写入租户标记和基线授权资源；不会创建新租户，也不会修改现有部门与工作流数据。管理员密码仅在新创建 Keycloak 用户时生效。"
                    />
                )}
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
