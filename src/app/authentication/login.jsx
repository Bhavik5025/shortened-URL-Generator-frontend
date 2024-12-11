import { useState } from "react";
import Cookies from "js-cookie";
import { useMutation } from "@tanstack/react-query";
import axios from "axios";
import { useRouter } from "next/navigation";
export default function Login() {
    const [name,setName]=useState("");
    const [password,setPassword]=useState("");
    const router=useRouter();
 
    const mutation=useMutation({
        mutationFn:async({ name, password })=>{
            try{
                const response=await axios.post(`${process.env.NEXT_PUBLIC_DB_API}/Login`,{
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
           
            const { status, data } = res; // Destructure status and data from the response
            if (status === 200) {
              alert(data.message); // Access the message from response data
              Cookies.set("token", data.token); // Set the token in cookies
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
    <form onSubmit={submit}>
      <input
        type="text"
        className="w-full p-5"
        placeholder="enter Name"
        onChange={(e)=>setName(e.target.value)}
      ></input>
      <input
        type="password"
        className="w-full p-5"
        placeholder="enter password"
        onChange={(e)=>setPassword(e.target.value)}
></input>
      <div className="w-full flex justify-center">
        <button type="submit" className="py-3 px-5 mb-3 bg-red-500 text-white rounded-xl">Save</button>
      </div>
    </form>
  );
}
