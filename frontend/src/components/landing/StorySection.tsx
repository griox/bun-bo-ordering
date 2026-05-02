'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';
import Image from 'next/image';

export function StorySection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            type: 'image',
            content: "/images/img1.png",
            alt: "Story Image 1"
        },
        {
            type: 'image',
            content: "/images/img2.png",
            alt: "Story Image 2"
        },
        {
            type: 'image',
            content: "/images/img3.png",
            alt: "Story Image 3"
        },
        {
            type: 'image',
            content: "/images/IMG_4330.png",
            alt: "Story Image 3"
        },
        {
            type: 'image',
            content: "/images/IMG_4331.png",
            alt: "Story Image 3"
        },
        {
            type: 'map',
            content: "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3899.208107931326!2d109.19532187584102!3d12.274404087983804!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31706700617a79cf%3A0xc7be36136df2332c!2zQsO6biBCw7IgJiBDw6AgUGjDqiBQaOG7kQ!5e0!3m2!1svi!2s!4v1710226456000!5m2!1svi!2s",
            alt: "Location Map"
        }
    ];

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Auto-slide effect
    useEffect(() => {
        const interval = setInterval(() => {
            nextSlide();
        }, 9000); // Change slide every 5 seconds

        return () => clearInterval(interval);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <section className="py-20 text-paper relative" id="story">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] bg-paper rounded-lg rotate-2 border-4 border-white shadow-2xl p-4 transform transition-transform hover:rotate-0 relative overflow-hidden">

                        {/* Carousel Content */}
                        <div className="w-full h-full relative bg-gray-200 overflow-hidden">
                            {slides[currentSlide].type === 'image' ? (
                                <Image
                                    src={slides[currentSlide].content}
                                    alt={slides[currentSlide].alt}
                                    fill
                                    sizes="(max-width: 768px) 100vw, 50vw"
                                    className="object-cover transition-all duration-700"
                                    loading={currentSlide === 0 ? "eager" : "lazy"}
                                    priority={currentSlide === 0}
                                />
                            ) : (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={slides[currentSlide].content}
                                    title="Google Maps"
                                    loading="lazy"
                                    className="w-full h-full transition-all duration-700"
                                ></iframe>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-text p-2 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-text p-2 rounded-full shadow-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity z-10"
                        >
                            <ChevronRight size={24} />
                        </button>

                        {/* Indicators */}
                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                            {slides.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-colors ${currentSlide === index ? 'bg-primary' : 'bg-white/50'}`}
                                ></div>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="w-full md:w-1/2 ">
                    <h2 className="font-display text-5xl mb-6 leading-tight">
                        KHÔNG CHỈ LÀ <br />
                        <span className="text-secondary">BÚN BÒ...</span>
                    </h2>
                    <div className="space-y-6 font-main text-lg leading-relaxed text-text/90 font-large">
                        <p>
                            Tọa lạc dưới tòa chung cư cũ, <strong>Bún Bò & Cà Phê Phố</strong> đã lặng lẽ gắn bó với thực khách suốt hơn 8 năm qua. Ở đây, mỗi tô bún bò được nấu bằng sự chỉn chu và kiên nhẫn: nước dùng ninh từ xương ống suốt nhiều giờ, thịt bò tươi được chọn mỗi sáng, nêm nếm vừa miệng để ai ăn cũng thấy quen, thấy dễ thương.
                        </p>
                        <p>
                            Bên cạnh bún bò, quán còn có cà phê pha trộn Robusta và Arabica, cho vị đậm vừa, hậu thơm nhẹ — rất hợp để nhâm nhi trong buổi sáng nhiều gió biển hay một chiều ngồi chậm lại. Một quán nhỏ, giá cả phải chăng, mang cảm giác thân quen và bình dị đúng kiểu thành phố biển: không ồn ào, nhưng đủ để người ta muốn quay lại.
                        </p>
                    </div>

                    <div className="mt-8 flex gap-4">
                        <div className="text-center">
                            <div className="font-display text-4xl text-secondary">8+</div>
                            <div className="text-sm opacity-80">Năm Kinh Nghiệm</div>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div className="text-center">
                            <div className="font-display text-4xl text-secondary">100%</div>
                            <div className="text-sm opacity-80">Nguyên Liệu Sạch</div>
                        </div>
                        <div className="w-px bg-white/20"></div>
                        <div
                            className="text-center cursor-pointer hover:bg-white/10 rounded-lg p-1 transition-colors"
                            onClick={() => setCurrentSlide(3)}
                        >
                            <div className="font-display text-4xl text-secondary flex justify-center items-center gap-1">
                                <MapPin size={32} />
                            </div>
                            <div className="text-sm opacity-80 underline decoration-dashed"><a href="https://www.google.com/maps?q=Bún+Bò+%26+Cà+Phê+Phố,+634+Đ.2/4+Chung+Cư,+khu+B,+Nha+Trang,+Khánh+Hòa+57000&ftid=0x31706700617a79cf:0xc7be36136df2332c&entry=gps&lucs=,94286594,94284511,94231188,47071704,94218641,94282134,94286869&g_ep=CAISEjI1LjI5LjEuNzgyOTg1OTc1MBgAIIgnKj8sOTQyODY1OTQsOTQyODQ1MTEsOTQyMzExODgsNDcwNzE3MDQsOTQyMTg2NDEsOTQyODIxMzQsOTQyODY4NjlCAlZO&skid=5746e2ca-adcd-4a56-924d-58a70eca6f68&g_st=ia" target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>Xem bản đồ</a></div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
