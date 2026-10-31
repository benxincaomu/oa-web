"use client"
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { message } from 'antd';

// 定义统一的API响应格式
export interface ApiResponse<T = any> {
  code: number;
  data: T;
  message: string;
  [key: string]: any;
}

// 扩展 axios 实例以支持泛型
interface CustomAxiosInstance {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}

const service = axios.create({
    baseURL:"/server",
    timeout: 20000, // 超时时间
    withCredentials: true,
    withXSRFToken: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
    headers: {
        'Content-Type': 'application/json',
    },
}) as CustomAxiosInstance & typeof axios;

// 登录态失效时统一跳转 Keycloak 授权入口
const redirectToLogin = () => {
    if (typeof window !== 'undefined') {
        window.location.assign('/server/oauth2/authorization/keycloak');
    }
};

// 请求拦截器
service.interceptors.request.use(
    (config) => config,
    (error) => {
        return Promise.reject(error);
    }
);

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        // Spring Security 在会话失效时会把 XHR 302 到 Keycloak 登录页，
        // axios 会跟随重定向拿到 HTML；此时直接走重新登录，避免页面报“网络请求失败”。
        const contentType = response.headers?.['content-type'];
        if (typeof contentType === 'string' && contentType.includes('text/html')) {
            redirectToLogin();
            return new Promise(() => {});
        }
        const res = response.data;
        if (!res || typeof res.code !== 'number') {
            return res;
        }
        if (res.code === 10002) {
            message.error(res.message);
        } else if (res.code === -1) {
            // 后端启动时自动初始化 Keycloak 角色/权限，暂无初始化页面可跳转
            message.error(res.message || '系统正在初始化，请稍后刷新页面');
            return Promise.reject(new Error(res.message || '系统正在初始化'));
        } else if (res.code !== 200) {
            message.error(res.message || '操作失败');
            return Promise.reject(new Error(res.message || '操作失败'));
        }
        return res;
    },
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            redirectToLogin();
            return new Promise(() => {});
        } else if (status === 403) {
            message.error('当前账号没有执行此操作的权限');
        } else {
            message.error('网络请求失败');
        }
        return Promise.reject(error);
    }
);

export default service;
