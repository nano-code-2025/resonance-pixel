import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { api } from "../../services/api";

interface Props {
  onLogin: (isNew: boolean) => void;
}

export function AuthPage({ onLogin }: Props) {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();

  const sendOtp = async () => {
    setLoading(true);
    setError("");
    try {
      await api.sendOtp(phone);
      setOtpSent(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "发送失败");
    } finally {
      setLoading(false);
    }
  };

  const verify = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await login(phone, otp);
      onLogin(result.is_new);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "验证失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pixel-grid min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs">
        <h1 className="text-[#C4956A] font-mono text-xl mb-2">RESONANCE</h1>
        <p className="text-[#A09CA0] text-xs mb-8 font-mono">找到同频的人</p>
        <div className="pixel-border bg-[#14142A] p-6">
          {!otpSent ? (
            <>
              <label className="text-[#A09CA0] text-xs font-mono block mb-2">手机号</label>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="13800000000"
                className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-3 text-sm font-mono text-[#F0EDE8] mb-4 focus:outline-none focus:border-[#C4956A]"
              />
              <button
                onClick={sendOtp}
                disabled={loading || phone.length < 11}
                className="pixel-btn w-full bg-[#C4956A] text-[#0D0D1A] py-3 font-mono text-sm disabled:opacity-50"
              >
                {loading ? "发送中..." : "获取验证码"}
              </button>
            </>
          ) : (
            <>
              <label className="text-[#A09CA0] text-xs font-mono block mb-2">验证码</label>
              <input
                type="text"
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder="123456"
                maxLength={6}
                className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-3 text-sm font-mono text-[#F0EDE8] mb-4 focus:outline-none focus:border-[#C4956A] tracking-widest text-center"
              />
              <button
                onClick={verify}
                disabled={loading || otp.length < 6}
                className="pixel-btn w-full bg-[#C4956A] text-[#0D0D1A] py-3 font-mono text-sm disabled:opacity-50"
              >
                {loading ? "验证中..." : "登录 / 注册"}
              </button>
            </>
          )}
          {error && <p className="text-red-400 text-xs mt-3 font-mono">{error}</p>}
        </div>
      </div>
    </div>
  );
}
