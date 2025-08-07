"use client"
import { useState, useEffect } from "react";
import service from "@/commons/base/service";
import { Menu } from 'antd';
import { usePathname, useSearchParams } from 'next/navigation';
import { ItemType } from "antd/es/menu/interface";
import {MenuInfo} from "rc-menu/lib/interface";
interface MenuItem {
    id: number;
    name: string;
    key: string;
    label: string;
    value: string;
    children?: MenuItem[];
}
const fillMenuItems = (data: MenuItem[]) => {
    if (data) {

        data.forEach((item: any) => {
            item.key = item.id + "";
            item.label = item.name;
            item.type = item.type;
            delete item.parentId;
            if (item.children && item.children.length > 0) {
                fillMenuItems(item.children);
            }
        });
    }
}
const findSelectedKeys = (data: MenuItem[], value?: string) => {
    if (value == null) {
        return [];
    }
    let selectedKeys: string[] = [];
    if (data && data.length > 0) {

        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            if (item.value === value) {
                return [item.key + ""];
            } else if (item.children && item.children.length > 0) {
                selectedKeys = selectedKeys.concat(findSelectedKeys(item.children, value));
            }
        }
    }
    return selectedKeys;

}
// 获取祖先 key 路径
const getAncestorKeys = (data: MenuItem[], selectedKey: string): string[] => {
    const path: string[] = [];

    const findPath = (items: MenuItem[], targetKey: string): boolean => {
        for (const item of items) {
            if (item.key === targetKey) {
                return true;
            }

            if (item.children) {
                const found = findPath(item.children, targetKey);
                if (found) {
                    path.push(item.key);
                    return true;
                }
            }
        }
        return false;
    };

    findPath(data, selectedKey);
    return path;
};


const SideMenu = () => {
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const pathName = usePathname();
    const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
    const [openKeys, setOpenKeys] = useState<string[]>([]);
    useEffect(() => {
        setTimeout(() => {
            service.get("/user/getMyMenus").then((res) => {
                fillMenuItems(res.data as MenuItem[])
                setMenuItems(res.data as MenuItem[]);
                // console.log("res.data", res.data);
                const keys = findSelectedKeys(res.data as MenuItem[], pathName as string);
                if (typeof keys !== "undefined") {
                    setSelectedKeys(keys);
                    if (keys.length > 0) {
                        const ancestorKeys = getAncestorKeys(res.data as MenuItem[], keys[0]);
                        setOpenKeys(ancestorKeys);
                    }
                }
            });
        }, 300);
    }, []);

    const onClickMenu = ({ item, key, keyPath, domEvent }:any) => {
        // console.log("item:", item);
        if (item.props.value) {
            window.location.href = item.props.value;
        }
    };

    return (<>
        <Menu
            mode="inline"
            theme="dark"
            items={menuItems as ItemType[]}
            selectable
            onClick={({ item, key, keyPath, domEvent }) => {
                onClickMenu({ item, key, keyPath, domEvent });
            }}
            selectedKeys={selectedKeys}
            openKeys={openKeys}
            onOpenChange={(keys) => setOpenKeys(keys)}
        />
    </>);
};
export default SideMenu;