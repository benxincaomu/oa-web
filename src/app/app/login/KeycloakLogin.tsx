"use client";

import { Button, Space, message } from "antd";
import { useEffect, useState } from "react";
import service from "@/commons/base/service";

interface UserInfo {
    name: string;
    userName: string;
}

export default function KeycloakLogin() {
    const [user, setUser] = useState<UserInfo | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        service.get<UserInfo>("/login/myInfo")
            .then((response) => setUser(response.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false));
    }, []);

    const startLogin = () => {
        window.location.assign("/server/oauth2/authorization/keycloak");
    };

    const logout = async () => {
        try {
            const response = await service.post<{ redirectUrl: string }>(
                "/login/logout",
                {},
                { headers: { "X-Requested-With": "XMLHttpRequest" } },
            );
            window.location.assign(response.data.redirectUrl);
        } catch {
            message.error("退出登录失败，请重试");
        }
    };

    return (
        <div style={{ height: "100%", display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            {user ? (
                <Space>
                    <span style={{ color: "#fff" }}>{user.name || user.userName}</span>
                    <Button type="link" onClick={logout}>退出登录</Button>
                </Space>
            ) : (
                <Button loading={loading} onClick={startLogin}>使用 Keycloak 登录</Button>
            )}
        </div>
    );
}
