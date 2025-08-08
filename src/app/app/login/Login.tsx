"use client"
import { Button, Form, Input, Modal, message, Space } from "antd";
import { useEffect, useState } from "react";
import service from "@/commons/base/service";
import Cookies from 'universal-cookie';
function Login() {
    const [open, setOpen] = useState(false);
    const [form] = Form.useForm();
    const [token, setToken] = useState("");
    const [name, setName] = useState("");
    const [messageApi, contextHolder] = message.useMessage();
    useEffect(() => {
        const cookies = new Cookies();
        const tmpToken = cookies.get("token");
        if (tmpToken) {
            setToken(tmpToken);
        }


    }, []);
    useEffect(() => {
        if (token) {
            const cookies = new Cookies();
            loadMyInfo();
        }
    }, [token]);


    const saveToken = (token: string) => {
        setToken(token);
    };
    const loadMyInfo = () => {
        service.get("/login/myInfo").then((res) => {
            setName(res.data.name);
         });
    }

    const handleLogin = (values: any) => {
        values["remember"] = true;
        service
            .post("/login/login", values)
            .then((response) => {
                // console.log("登录成功:", response.data);
                if (response.code === 200) {
                    saveToken(response.data);
                    setOpen(false);
                    messageApi.info("登录成功");
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                    

                } else {
                    messageApi.error("登录失败");
                }
            })
            .catch((error) => {
                messageApi.error("登录失败");
            });

    };
    const handleLogout = () => {
        service.post("/login/logout").then((response) => {
            message.success("登出成功");
            const cookies = new Cookies();
            cookies.remove('token', { path: '/' });
            cookies.remove('name', { path: '/' });
            window.location.href = "/app";
        });
    };
    return (
        <div
            style={{
                height: "100%",
                display: "flex",
                justifyContent: "flex-end",
                alignItems: "center",
            }}
        >
            {name
                ? (<Space>
                    <div style={{ color: "#ffffff" }}>{name}</div>
                    <a onClick={() => {
                        handleLogout();
                    }}>登出</a>
                </Space>
                )
                : (<Button onClick={() => setOpen(true)}>登录</Button>)

            }

            <Modal
                title="登陆"
                open={open}
                centered
                onCancel={() => {
                    setOpen(false);
                }}
                footer={null}
            >
                <Form form={form} layout="vertical" onFinish={handleLogin}>
                    <Form.Item
                        label="用户名"
                        name="userName"
                        rules={[{ required: true }]}
                    >
                        <Input placeholder="请输入用户名" />
                    </Form.Item>

                    <Form.Item
                        label="密码"
                        name="password"
                        rules={[{ required: true }]}
                    >
                        <Input.Password placeholder="请输入密码" />
                    </Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        style={{ marginTop: 16 }}
                    >
                        登录
                    </Button>
                    <Button block style={{ marginTop: 16 }}>
                        取消
                    </Button>
                </Form>
            </Modal>
        </div>
    );
}
export default Login;
