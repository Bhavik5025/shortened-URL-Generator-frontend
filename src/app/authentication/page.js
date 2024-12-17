"use client";
import { useState } from "react";
import Login from "./login";
import Register from "./register";
export default function Authentication() {
  const [login, setLogin] = useState(true);
  const [register, setRegister] = useState(false);
  return (
    <div>
      <div className="w-full flex justify-center">
        <div className="w-full shadow-lg lg:w-1/3 md:w-1/3 m-5">
          <h1 className="text-center text-2xl font-bold mb-2">Authentication</h1>
          <div className="w-full flex">
            <div
              className={
                login
                  ? "w-1/2 text-center p-4  text-md font-bold hover:bg-red-500 hover:text-white rounded-lg bg-red-500 text-white"
                  : "w-1/2 text-center p-4 text-red-400 text-md font-bold hover:bg-red-500 hover:text-white rounded-lg"
              }
              onClick={() => {
                setLogin(true), setRegister(false);
              }}
            >
              <label>Login</label>
            </div>
            <div
              className={
                register
                  ? "w-1/2 text-center p-4  text-md  font-bold hover:bg-red-500 hover:text-white rounded-lg bg-red-500 text-white"
                  : "w-1/2 text-center p-4 text-red-400 text-md  font-bold hover:bg-red-500 hover:text-white rounded-lg"
              }
              onClick={() => {
                setLogin(false), setRegister(true);
              }}
            >
              <label>Register</label>
            </div>
          </div>
          {login ? <Login /> : null}
          {register ? <Register /> : null}
        </div>
      </div>
    </div>
  );
}
