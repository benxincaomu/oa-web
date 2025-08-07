"use client"; 

import { Button, Form, Input, message, Modal, Space, Table, Popconfirm, Select, TreeSelect } from "antd";
import { useEffect, useState } from "react";
import axios from "axios";
import service from "@/commons/base/service";

interface User {

    id: number;
    name: string;
    email: string;
    userName: string;
    mobile: string;
}
interface Role {
    id: number;
    name: string;
}

const UserManager = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [addUserFrom] = Form.useForm();
    const [searchUserForm] = Form.useForm();

    const [users, setUsers] = useState<User[]>([]);
    const [currPage, setCurrPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const loadUsers = () => {
        // 模拟从服务器获取用户数据
        const userName = searchUserForm.getFieldValue("userNameS");
        const name = searchUserForm.getFieldValue("nameS");

        service.get("/user/list", {
            params: {
                name: name,
                userName: userName,
                currPage: currPage,
                pageSize: pageSize,
            },
        })
            .then((response) => {
                setUsers(response.data.content); // 假设后端返回 { users: [...] }
            })
            .catch((error) => {
                console.error("Error loading users:", error);
                messageApi.error("加载用户失败");
            });
    };

    useEffect(() => {
        document.title = "用户管理";
        setTimeout(() => {
            loadUsers();
        }, 500);
    }, []);
    /**
     * 添加用户
     * @param values the form values
     */
    const handleAddUser = (values: any) => {
        service.post("/user", {
            ...values
        }).then((res) => {
            if (res.code === 200) {
                messageApi.success("添加用户成功");
                addUserFrom.resetFields();
                setIsModalOpen(false);
                loadUsers();
            } else {
                messageApi.error(res.data);
            }
        });
    };

    const handleDelete = (id: number) => {
        axios.delete(`/user/${id}`, {
            headers: {
            },
        }).then(() => {
            messageApi.success("用户删除成功");
            loadUsers();
        });
    };

    const columns = [
        {
            title: "ID",
            dataIndex: "id",
            key: "id",
        },
        {
            title: "用户名",
            dataIndex: "userName",
            key: "userName",
        }, {
            title: "姓名",
            dataIndex: "name",
            key: "name",
        },
        {
            title: "手机号",
            dataIndex: "mobile",
            key: "mobile",
        },
        {
            title: "邮箱",
            dataIndex: "email",
            key: "email",
        },
        {
            title: "操作",
            key: "action",
            render: (_: any, record: User) => (
                <Space size="middle">

                    <Popconfirm title="确定要禁用吗？" okText="确定" cancelText="取消" onConfirm={() => { }}>
                        <a>
                            禁用
                        </a>
                    </Popconfirm>
                    <a onClick={() => { }}>修改</a>
                    <a onClick={() => {
                        beforeAssignRole(record as User);
                    }}>分配角色</a>
                    <a onClick={() => {
                        onAssignDeptOpen(record as User);

                    }}>分配部门</a>
                </Space>
            ),
        },
    ];

    // 角色相关
    const [assignRoleForm] = Form.useForm();
    const [roles, setRoles] = useState<Role[]>([]);
    const beforeAssignRole = (user: User) => {
        // console.log("beforeAssignRole", roles.length);
        if (roles.length === 0) {
            service.get("/role/listAll").then((res) => {
                setRoles(res.data);
            });
        }
        service.get(`/user/getRoleIdByUserId/${user.id}`).then(res => {
            if (res.data) {
                // setRoleId(res.data);
                assignRoleForm.setFieldValue("roleId", res.data);
            }
            setOperatingUser(user as User);
            setUserId(user.id);
            setAssignOpen(true);

        });
    }
    const onAssignClose = () => {
        assignRoleForm.resetFields();
        setAssignOpen(false);
        setOperatingUser(nullUser);
        setUserId(0);
        setRoleId(0);
    };
    const nullUser = {
        id: 0,
        userName: "",
        name: "",
    } as User;
    const [operatingUser, setOperatingUser] = useState<User>(nullUser);
    const [userId, setUserId] = useState(0);
    const [assignOpen, setAssignOpen] = useState(false);
    //选定用户当前的id
    const [roleId, setRoleId] = useState(0);
    const onAssignFinish = (values: any) => {
        service.post("/user/assignRole", { ...values }).then(res => {
            messageApi.success("分配成功");
            onAssignClose();
        });
    };
    // 分配部门相关
    const [assignDeptOpen, setAssignDeptOpen] = useState(false);
    const [assignDeptForm] = Form.useForm();
    const [depts, setDepts] = useState<any[]>([]);

    const onAssignDeptOpen = (user: User) => {
        // console.log("user",user);
        setOperatingUser(user);
        setUserId(user.id);
        service.get(`/user/getDeptIdByUserId/${user.id}`).then(res => {
            assignDeptForm.setFieldValue("departmentId", res.data);
            setAssignDeptOpen(true);
            // assignDeptForm.resetFields();
        });
        if (depts.length == 0) {
            service.get("/organize/listTree").then((res) => {
                setDepts([{ id: 0, name: "无部门" }].concat(res.data));
                // setDepts(res.data);
            });
        }

    };
    const onAssignDeptClose = () => {
        setAssignDeptOpen(false);
        setOperatingUser(nullUser);
        assignDeptForm.resetFields();


    };
    const onAssignDeptFinish = (values: any) => {
        values.userId = operatingUser.id;
        service.post("/user/assignDept", values).then((res) => {
            // console.log(res);
            onAssignDeptClose();
            messageApi.success("操作成功");
        });
    };

    return (
        <div>
            {contextHolder}
            <div>
                {/* 搜索框 */}
                <Form
                    form={searchUserForm}
                    layout="inline"
                    onFinish={() => {
                        loadUsers();
                    }}
                >
                    <Form.Item name="userNameS">
                        <Input placeholder="用户名" />
                    </Form.Item>
                    <Form.Item name="nameS">
                        <Input placeholder="姓名" />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit">查询</Button>
                    </Form.Item>
                    <Form.Item>

                        <Button type="primary" onClick={() => setIsModalOpen(true)}>
                            新增用户
                        </Button>
                    </Form.Item>
                </Form>
            </div>
            <br />
            <Table
                dataSource={users}
                columns={columns}
                pagination={{ pageSize: 20 }}
                rowKey={(record) => record.id}
                bordered={true}
                rowClassName={(record, index) => index % 2 === 0 ? 'row-class-0' : 'row-class-1'}
                onChange={(pagination, filters, sorter, extra) => {
                    setCurrPage(pagination.current || 1);
                    setPageSize(pagination.pageSize || 20);
                    loadUsers();
                }}
            />

            <Modal
                title="新增用户"
                open={isModalOpen}
                onCancel={() => setIsModalOpen(false)}
                footer={null}
            >
                <Form form={addUserFrom} onFinish={handleAddUser}>

                    <Form.Item
                        name="id"
                        hidden                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="用户名"
                        name="userName"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="姓名"
                        name="name"
                        rules={[{ required: true }]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label="邮箱"
                        name="email"
                        rules={[]}
                    >
                        <Input />
                    </Form.Item>
                    <Form.Item
                        label="手机号码"
                        name="mobile"
                        rules={[]}
                    >
                        <Input />
                    </Form.Item>
                    <Button type="primary" htmlType="submit" block>
                        提交
                    </Button>
                </Form>
            </Modal>
            <Modal
                title="分配角色"
                open={assignOpen}
                footer={null}
                onCancel={() => {
                    onAssignClose();
                }}
            >
                <Form
                    name="assign"
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    onFinish={(values) => {
                        onAssignFinish(values);
                    }}
                    autoComplete="off"
                    form={assignRoleForm}
                >
                    <Form.Item label="角色" name="roleId" rules={[{ required: true, message: '请选择角色' }]} >
                        <Select showSearch options={roles} fieldNames={{ label: 'name', value: 'id' }} placeholder="请选择角色" />
                    </Form.Item>
                    <Form.Item name="userId" initialValue={userId}>
                        <Input type="hidden" />
                    </Form.Item>
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type="primary" htmlType="submit">
                            提交
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal
                title="分配部门"
                open={assignDeptOpen}
                footer={null}
                onCancel={() => {
                    onAssignDeptClose();
                }}
                closable={false}
            >
                <Form
                    labelCol={{ span: 4 }}
                    wrapperCol={{ span: 20 }}
                    onFinish={(values) => {
                        onAssignDeptFinish(values);
                    }}
                    autoComplete="off"
                    form={assignDeptForm}
                >
                    <Form.Item label="部门" name="departmentId" rules={[{ required: true, message: '请选择角色' }]} >
                        <TreeSelect showSearch treeData={depts} fieldNames={{ label: 'name', value: 'id' }} treeNodeFilterProp="name" placeholder="请选择部门" />
                    </Form.Item>
                    {/* <Form.Item name="userId" hidden >
                        <Input type="hidden" value={userId} />
                    </Form.Item> */}
                    <Form.Item labelCol={{ span: 4 }} wrapperCol={{ span: 8, offset: 16 }}>
                        <Button type="primary" htmlType="submit">
                            提交
                        </Button>
                        &nbsp;&nbsp;
                        <Button onClick={() => {
                            onAssignDeptClose();
                        }}>
                            取消
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default UserManager;
