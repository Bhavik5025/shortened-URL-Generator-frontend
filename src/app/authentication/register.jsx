"use client"
import { useState } from "react";
import axios from "axios";
import { useMutation } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation"; 

import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
export default function Register() {
  const [name, setName] = useState("");
  const router=useRouter();
  const [password, setPassword] = useState("");
  const mutation=useMutation({
    mutationFn:async({ name, password })=>{
        try{
            const response=await axios.post(`${process.env.NEXT_PUBLIC_DB_API}/Register`,{
                name,password
            });
            return response;
        }catch(error){
            if (error.response && error.response.status === 400) {
                return error.response;
              }
              throw error;
        }
    },
    onSuccess:(res)=>{
        if(res.status==200)
        {
            alert("user Already Exist..Please Login")
            
        }
        const { status, data } = res; // Destructure status and data from the response
        if (status === 201) {
          alert(data.message); // Access the message from response data
          Cookies.set("token", data.token,{ expires: 1 }); // Set the token in cookies
          router.push("/"); // Navigate to the desired page
        }
    },
    onError:(error)=>{
        alert(error.message)
    }
})
  const submit=(event)=>{
        event.preventDefault();
        mutation.mutate({ name, password });
    }
  return (
    <form onSubmit={submit} className="p-3">
      <Input
        type="text"
        className="my-2"
        placeholder="Enter Name"
        onChange={(e) => setName(e.target.value)} 
        required
      ></Input>
      <Input
        type="password"
        placeholder="Enter password"
        className="my-2"
        onChange={(e) => setPassword(e.target.value)} 
        required
      ></Input>
      <div className="w-full flex justify-center">
        <Button type="submit" >Register</Button>
      </div>
    </form>
  );
}
