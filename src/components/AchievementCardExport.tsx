import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Download, Crown, Sparkles, Award, Star, X, CheckCircle2, Trophy, Compass, Shield, Flame, Activity, Hourglass, Calendar, Book, Clock, Cpu, Lock } from 'lucide-react';
import { store } from '../lib/store';

// A mapping to get actual lucide components by name or predefined id if needed
// We'll rely on passing the icons if possible, or mapping them
const ICONS: Record<string, any> = {
  Compass, Flame, Shield, Calendar, Award, Star, Sparkles, Book, Clock, Activity, Hourglass, Cpu
};

interface AchievementCardProps {
  points: number;
  streak: number;
  unlockedBadges: any[];
  onClose: () => void;
}

export const AchievementCard = ({ points, streak, unlockedBadges, onClose }: AchievementCardProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const captureRef = useRef<HTMLDivElement>(null);
  const user = store.getCurrentUser();
  const userName = user?.name || "Học Giả";

  const [currentIndex, setCurrentIndex] = useState(0);

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? unlockedBadges.length - 1 : prev - 1));
  };
  
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === unlockedBadges.length - 1 ? 0 : prev + 1));
  };

  const currentBadge = unlockedBadges[currentIndex];

  const handleExportPDF = async () => {
    if (!captureRef.current) return;
    try {
      setIsExporting(true);
      
      const { jsPDF } = await import('jspdf');
      const { toPng } = await import('html-to-image');
      
      const imgData = await toPng(captureRef.current, {
        cacheBust: true,
        backgroundColor: '#000000',
        pixelRatio: 2,
        style: {
          transform: 'scale(1)',
          transformOrigin: 'top left'
        }
      });

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: [800, 500]
      });
      
      pdf.addImage(imgData, 'PNG', 0, 0, 800, 500);
      pdf.save(`henosis-achievements-${user?.id || 'export'}-${Date.now()}.pdf`);
      
    } catch (err) {
      console.error('Export failed:', err);
      if (err instanceof Error) {
         alert(`Tải xuống thất bại. Chi tiết lỗi: ${err.message}`);
      } else {
         alert('Tải xuống thất bại. Lỗi kết xuất hình ảnh.');
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl bg-zinc-950 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
        
        {/* Nút Đóng */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-black/50 text-zinc-400 hover:text-white rounded-full hover:bg-zinc-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Khung Render Để Ẩn Đi Khi Capture Hoặc Hiện Cho Preview */}
        {/* Cấu trúc này sẽ được export trọn bộ */}
        <div 
          ref={captureRef}
          className="w-full flex flex-col md:flex-row min-h-[500px] relative bg-zinc-950 overflow-hidden"
          style={{ width: '800px', height: '500px' }}
        >
          {/* Cột trái: Tổng quan User */}
          <div className="w-full md:w-1/3 p-8 border-r border-zinc-900 bg-gradient-to-br from-zinc-950 to-black flex flex-col items-center justify-center relative">
            <div className="absolute inset-0 bg-orange-500/5 pointer-events-none"></div>
            
            <Crown className="w-16 h-16 text-orange-500 mb-4 drop-shadow-[0_0_15px_rgba(249,115,22,0.5)]" />
            
            <h2 className="text-xl font-bold text-zinc-400 mb-1 tracking-widest uppercase text-center">HỒ SƠ VINH DANH</h2>
            <h1 className="text-3xl font-black text-white text-center mb-6">{userName}</h1>
            
            <div className="w-full space-y-4 relative z-10">
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Tổng Điểm</p>
                  <p className="text-white font-black text-xl">{points.toLocaleString()} XP</p>
                </div>
              </div>
              
              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                <Flame className="w-8 h-8 text-orange-500" />
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Chuỗi Ngày</p>
                  <p className="text-white font-black text-xl">{streak} Ngày</p>
                </div>
              </div>

              <div className="bg-zinc-900/50 p-4 rounded-2xl border border-zinc-800 flex items-center gap-4">
                <Trophy className="w-8 h-8 text-emerald-500" />
                <div>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Huy Chương</p>
                  <p className="text-white font-black text-xl">{unlockedBadges.length} Đã Đạt</p>
                </div>
              </div>
            </div>
            
            <div className="mt-8 text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
              COSTUDY HENOSIS • {(new Date()).toLocaleDateString('vi-VN')}
            </div>
          </div>

          {/* Cột phải: Carousel Huy Chương (Static Grid for PDF or specific layout) */}
          <div className="w-full md:w-2/3 bg-black flex flex-col justify-center items-center relative overflow-hidden p-8">
            {unlockedBadges.length === 0 ? (
              <div className="text-center text-zinc-600 flex flex-col items-center gap-4">
                <Lock className="w-16 h-16 opacity-50" />
                <p className="font-bold text-lg">Chưa có huy chương nào để hiển thị.</p>
              </div>
            ) : (
              <>
                <div className="absolute top-8 left-8">
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Award className="w-6 h-6 text-orange-500" /> Bộ Sưu Tập Tinh Hoa
                  </h3>
                </div>

                <div className="w-full max-w-sm mt-8 relative z-10">
                   <AnimatePresence mode="wait">
                      <motion.div
                        key={currentBadge?.id}
                        initial={{ opacity: 0, x: 50, scale: 0.9 }}
                        animate={{ opacity: 1, x: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -50, scale: 0.9 }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative"
                      >
                         <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent rounded-3xl pointer-events-none"></div>
                         
                         <div className={`w-24 h-24 rounded-2xl flex items-center justify-center mb-6 shadow-2xl border-2 ${currentBadge.border || 'border-zinc-700'} ${currentBadge.bg || 'bg-zinc-800'}`}>
                           {currentBadge.icon ? (
                             <currentBadge.icon className={`w-12 h-12 ${currentBadge.color || 'text-white'}`} />
                           ) : (
                             <Award className="w-12 h-12 text-zinc-400" />
                           )}
                         </div>

                         <h4 className="text-2xl font-black text-white mb-2">{currentBadge.name}</h4>
                         <p className="text-zinc-400 font-medium mb-4">{currentBadge.desc}</p>
                         
                         <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-400 px-4 py-2 rounded-xl text-sm font-bold border border-emerald-500/20">
                            <CheckCircle2 className="w-4 h-4" /> Đã Mở Khóa Đạt Chuẩn
                         </div>
                      </motion.div>
                   </AnimatePresence>
                </div>
                
                {/* Navigation (Sẽ bị render trong PDF nhưng ko sao, nhìn đẹp) */}
                <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4 z-20">
                  <span className="text-zinc-500 font-bold bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                    {currentIndex + 1} / {unlockedBadges.length}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Lớp Overlay Điều Khiển (Không nằm trong vùng CaptureRef để không bị dính vào PDF!) */}
        <div className="absolute inset-0 z-40 pointer-events-none flex items-center justify-between p-4 md:p-8">
           {unlockedBadges.length > 1 && (
             <>
               <button onClick={prevSlide} className="pointer-events-auto p-3 bg-black/50 hover:bg-black text-white rounded-full border border-zinc-800 transition active:scale-90">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
               <button onClick={nextSlide} className="pointer-events-auto p-3 bg-black/50 hover:bg-black text-white rounded-full border border-zinc-800 transition active:scale-90">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
               </button>
             </>
           )}
        </div>

        <div className="absolute bottom-8 right-8 z-50 pointer-events-auto flex items-center gap-3">
            <button
              onClick={handleExportPDF}
              disabled={isExporting}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-400 text-black px-6 py-3 rounded-2xl font-black transition-all active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50"
            >
              {isExporting ? (
                <><Hourglass className="w-5 h-5 animate-spin" /> Đang Kết Xuất PDF...</>
              ) : (
                <><Download className="w-5 h-5" /> Tải Xuống Hồ Sơ Tự Hào (PDF)</>
              )}
            </button>
        </div>

      </div>
    </div>
  );
};
