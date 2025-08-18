"use client";
import { useEffect } from "react";

 
 
 export default function IndexPage () {
    useEffect(() => {
        window.location.href = '/app';
    }, []);
    return (
        <div>
        <h1>Welcome to the Index Page</h1>
        <p>This is the main entry point of the application.</p>
        </div>
    );
}