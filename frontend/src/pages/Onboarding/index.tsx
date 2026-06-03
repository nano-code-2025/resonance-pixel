import { useState, useRef } from "react";
import { api } from "../../services/api";

interface Props {
  onComplete: () => void;
}

type Step = 1 | 2 | 3 | 4;

const STEPS = ["上传头像", "基本信息", "我的性格", "期望对象"];

const PERSONALITY_OPTIONS = [
  "理性冷静", "感性细腻", "幽默风趣", "踏实可靠",
  "追求自由", "家庭导向", "事业心强", "随遇而安",
  "爱好运动", "宅家爱好", "喜欢旅行", "爱读书",
];

const EDUCATION_OPTIONS = ["高中及以下", "大专", "本科", "硕士", "博士"];
const GENDER_OPTIONS = [
  { value: "M", label: "男" },
  { value: "F", label: "女" },
];

export function OnboardingPage({ onComplete }: Props) {
  const [step, setStep] = useState<Step>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — selfie
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Step 2 — facts
  const [age, setAge] = useState("");
  const [city, setCity] = useState("");
  const [gender, setGender] = useState("");
  const [education, setEducation] = useState("");
  const [work, setWork] = useState("");

  // Step 3 — values
  const [lifeGoals, setLifeGoals] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Step 4 — requirements
  const [reqGender, setReqGender] = useState("");
  const [reqAgeMin, setReqAgeMin] = useState("");
  const [reqAgeMax, setReqAgeMax] = useState("");
  const [reqCity, setReqCity] = useState("");
  const [reqDesc, setReqDesc] = useState("");

  const handleSelfieChange = (file: File) => {
    setSelfieFile(file);
    const reader = new FileReader();
    reader.onload = e => setSelfiePreview(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 5 ? [...prev, tag] : prev
    );
  };

  const nextStep = async () => {
    setError("");
    setLoading(true);
    try {
      if (step === 1) {
        if (selfieFile) {
          await api.uploadSelfie(selfieFile);
        }
        setStep(2);
      } else if (step === 2) {
        if (!age || !city || !gender) {
          setError("请填写年龄、城市和性别");
          return;
        }
        await api.updateProfile({ age: Number(age), city, gender, education, work });
        setStep(3);
      } else if (step === 3) {
        await api.updateProfile({
          life_goals: lifeGoals,
          personality_tags: selectedTags,
        });
        setStep(4);
      } else if (step === 4) {
        await api.updateProfile({
          requirements: {
            gender: reqGender,
            age_min: reqAgeMin ? Number(reqAgeMin) : undefined,
            age_max: reqAgeMax ? Number(reqAgeMax) : undefined,
            city: reqCity,
            description: reqDesc,
          },
          visibility: "active",
        });
        onComplete();
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return true; // selfie optional
    if (step === 2) return age.length > 0 && city.length > 0 && gender.length > 0;
    if (step === 3) return true;
    if (step === 4) return reqGender.length > 0;
    return false;
  };

  return (
    <div className="pixel-grid min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[#C4956A] font-mono text-lg mb-1">完善档案</h1>
          <div className="flex gap-1 mt-3">
            {STEPS.map((label, i) => (
              <div key={i} className="flex-1">
                <div
                  className={`h-1 ${i + 1 <= step ? "bg-[#C4956A]" : "bg-[#2A2A4A]"}`}
                />
                <p className={`text-[10px] font-mono mt-1 ${i + 1 === step ? "text-[#C4956A]" : "text-[#2A2A4A]"}`}>
                  {label}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pixel-border bg-[#14142A] p-6">
          {/* Step 1: Selfie */}
          {step === 1 && (
            <div>
              <p className="text-[#A09CA0] text-xs font-mono mb-4">
                上传一张清晰的正脸照，让对方先认识你
              </p>
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2A2A4A] hover:border-[#C4956A] cursor-pointer flex flex-col items-center justify-center h-48 transition-colors"
              >
                {selfiePreview ? (
                  <img src={selfiePreview} alt="preview" className="h-full w-full object-cover" />
                ) : (
                  <>
                    <div className="text-4xl mb-2">📷</div>
                    <p className="text-[#A09CA0] text-xs font-mono">点击上传照片</p>
                    <p className="text-[#2A2A4A] text-[10px] font-mono mt-1">JPG / PNG，≤5MB</p>
                  </>
                )}
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={e => e.target.files?.[0] && handleSelfieChange(e.target.files[0])}
              />
              <p className="text-[#2A2A4A] text-[10px] font-mono mt-3">
                可跳过，稍后在个人设置中添加
              </p>
            </div>
          )}

          {/* Step 2: Facts */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-[#A09CA0] text-xs font-mono block mb-1">年龄 *</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="25"
                    min="18"
                    max="60"
                    className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[#A09CA0] text-xs font-mono block mb-1">城市 *</label>
                  <input
                    type="text"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="上海"
                    className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-2">性别 *</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setGender(opt.value)}
                      className={`flex-1 py-2 font-mono text-sm border ${
                        gender === opt.value
                          ? "border-[#C4956A] text-[#C4956A]"
                          : "border-[#2A2A4A] text-[#A09CA0]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-2">学历</label>
                <div className="flex flex-wrap gap-1">
                  {EDUCATION_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setEducation(education === opt ? "" : opt)}
                      className={`px-2 py-1 font-mono text-xs border ${
                        education === opt
                          ? "border-[#C4956A] text-[#C4956A]"
                          : "border-[#2A2A4A] text-[#A09CA0]"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-1">职业</label>
                <input
                  type="text"
                  value={work}
                  onChange={e => setWork(e.target.value)}
                  placeholder="互联网工程师"
                  className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                />
              </div>
            </div>
          )}

          {/* Step 3: Values */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-1">
                  人生目标
                </label>
                <textarea
                  value={lifeGoals}
                  onChange={e => setLifeGoals(e.target.value)}
                  placeholder="简单描述你的生活方向和人生规划..."
                  rows={3}
                  className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A] resize-none"
                />
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-2">
                  性格标签 <span className="text-[#2A2A4A]">（最多选5个）</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {PERSONALITY_OPTIONS.map(tag => (
                    <button
                      key={tag}
                      onClick={() => toggleTag(tag)}
                      className={`px-2 py-1 font-mono text-xs border transition-colors ${
                        selectedTags.includes(tag)
                          ? "border-[#C4956A] text-[#C4956A] bg-[#C4956A]/10"
                          : "border-[#2A2A4A] text-[#A09CA0]"
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Requirements */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-2">期望对象性别 *</label>
                <div className="flex gap-2">
                  {GENDER_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setReqGender(opt.value)}
                      className={`flex-1 py-2 font-mono text-sm border ${
                        reqGender === opt.value
                          ? "border-[#C4956A] text-[#C4956A]"
                          : "border-[#2A2A4A] text-[#A09CA0]"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-1">年龄范围</label>
                <div className="flex gap-2 items-center">
                  <input
                    type="number"
                    value={reqAgeMin}
                    onChange={e => setReqAgeMin(e.target.value)}
                    placeholder="20"
                    min="18"
                    max="60"
                    className="flex-1 bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                  />
                  <span className="text-[#A09CA0] font-mono text-xs">—</span>
                  <input
                    type="number"
                    value={reqAgeMax}
                    onChange={e => setReqAgeMax(e.target.value)}
                    placeholder="35"
                    min="18"
                    max="60"
                    className="flex-1 bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                  />
                </div>
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-1">期望城市</label>
                <input
                  type="text"
                  value={reqCity}
                  onChange={e => setReqCity(e.target.value)}
                  placeholder="上海、北京（可不限）"
                  className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A]"
                />
              </div>
              <div>
                <label className="text-[#A09CA0] text-xs font-mono block mb-1">补充说明</label>
                <textarea
                  value={reqDesc}
                  onChange={e => setReqDesc(e.target.value)}
                  placeholder="对另一半的其他期望..."
                  rows={2}
                  className="w-full bg-[#0D0D1A] border border-[#2A2A4A] p-2 text-sm font-mono text-[#F0EDE8] focus:outline-none focus:border-[#C4956A] resize-none"
                />
              </div>
            </div>
          )}

          {error && <p className="text-red-400 text-xs mt-3 font-mono">{error}</p>}

          <div className="flex gap-2 mt-6">
            {step > 1 && (
              <button
                onClick={() => { setStep((step - 1) as Step); setError(""); }}
                className="flex-1 py-2 border border-[#2A2A4A] text-[#A09CA0] font-mono text-sm"
              >
                上一步
              </button>
            )}
            <button
              onClick={nextStep}
              disabled={loading || !canProceed()}
              className="flex-1 pixel-btn bg-[#C4956A] text-[#0D0D1A] py-3 font-mono text-sm disabled:opacity-50"
            >
              {loading ? "请稍候..." : step === 4 ? "完成注册" : "下一步"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
