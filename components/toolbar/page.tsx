// components/toolbar.tsx
// Server Component — ดึง user จาก JWT cookie แล้วส่งไปให้ Avatar

import Image from "next/image";
import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Avatar from "./avatar";

export default async function Toolbar() {
  // ดึง user จาก JWT access token (ไม่ต้อง fetch API)
  const session = await getCurrentUser();

  // ดึงข้อมูลเพิ่มเติมจาก DB ถ้า login อยู่ (เช่น avatarUrl)
  const user = session
    ? await prisma.user.findUnique({
        where: { id: session.sub },
        select: { username: true, email: true },
      })
    : null;

  return (
    <header className="h-10 bg-[#161616] border-b border-[#2b2b2c] flex items-center text-white text-xs px-2 w-full flex-none sticky top-0 z-40">
      {/* Left — Logo */}
      <div className="flex items-center h-full">
        <div className="flex items-center px-1.5 h-full space-x-2">
          <Image
            src="/aeitor.png"
            alt="AEITOR Logo"
            width={15}
            height={15}
            priority
            className="mr-2"
          />
          <span className="text-[#2d2f36]">/</span>
        </div>
      </div>

      {/* Center — ว่างไว้ขยาย */}
      <div className="flex-1" />

      {/* Right — Avatar (แสดงเฉพาะตอน login) */}
      {user && (
        <div className="flex items-center px-2">
          <Avatar user={user} />
        </div>
      )}
    </header>
  );
}