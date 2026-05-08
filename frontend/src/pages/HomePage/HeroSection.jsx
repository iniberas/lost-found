import React from "react";
import { useNavigate } from "react-router-dom";

const HeroSection = ({ user }) => {
  const navigate = useNavigate();

  return (
    <section className="bg-auth-pattern bg-repeat py-50 md:py-64 px-8 md:px-16 flex flex-col items-start text-left space-y-8 shadow-sm z-10 relative">
      <div className="w-full space-y-2">
        <h2 className="text-[48px] md:text-[62px] font-black text-[#0C0B89] leading-tight drop-shadow-md">
          {user ? `Halo, ${user.name}!` : "IPB Lost & Found"}
        </h2>
        <p className="text-[#768ADB] text-[20px] md:text-[22px] font-medium font-poppins drop-shadow-sm">
          Kehilangan atau Menemukan Barang di IPB?
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-[600px] pt-4">
        <button
          onClick={() => (user ? navigate("/lapor-hilang") : navigate("/auth"))}
          className="flex-1 bg-[#0C0B89] hover:bg-[#09086e] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-center text-[15px]"
        >
          Saya Kehilangan Barang
        </button>
        <button
          onClick={() => (user ? navigate("/lapor-temuan") : navigate("/auth"))}
          className="flex-1 bg-[#0C0B89] hover:bg-[#09086e] text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg transition-all active:scale-95 text-center text-[15px]"
        >
          Saya Menemukan Barang
        </button>
      </div>
    </section>
  );
};

export default HeroSection;
