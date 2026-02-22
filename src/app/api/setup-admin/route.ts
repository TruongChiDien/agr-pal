import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const apiKey = request.headers.get("x-api-key");
    const body = await request.json();
    const { name, email, password } = body;

    // Lấy NextAuth Secret từ môi trường (Next.js 14 / Auth.js thường dùng AUTH_SECRET)
    const authSecret = process.env.NEXTAUTH_SECRET;

    if (!authSecret) {
      return NextResponse.json(
        { error: "Server chưa cấu hình NEXTAUTH_SECRET" },
        { status: 500 }
      );
    }

    // So sánh key gửi lên với AUTH_SECRET
    if (!apiKey || apiKey !== authSecret) {
      return NextResponse.json(
        { error: "Unauthorized. API key không hợp lệ." },
        { status: 401 }
      );
    }

    // Xác thực đầu vào
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Vui lòng cung cấp đầy đủ: name, email, password" },
        { status: 400 }
      );
    }

    // Kiểm tra xem email đã tồn tại chưa
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Một tài khoản với email này đã tồn tại." },
        { status: 409 }
      );
    }

    // Băm mật khẩu và tạo tài khoản Admin
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role: "ADMIN",
      },
    });

    return NextResponse.json(
      {
        success: true,
        message: "Tạo tài khoản admin thành công!",
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Lỗi khi tạo admin qua API:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi trên server" },
      { status: 500 }
    );
  }
}
