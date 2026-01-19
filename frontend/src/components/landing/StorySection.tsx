'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, MapPin } from 'lucide-react';

export function StorySection() {
    const [currentSlide, setCurrentSlide] = useState(0);

    const slides = [
        {
            type: 'image',
            content: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80",
            alt: "Story Image"
        },
        {
            type: 'map',
            content: "https://maps.google.com/maps?q=Chung%20c%C6%B0%20V%C4%A9nh%20Ph%C6%B0%E1%BB%9Bc%20khu%20B%2C%20Nha%20Trang%2C%20Kh%C3%A1nh%20H%C3%B2a&t=&z=17&ie=UTF8&iwloc=&output=embed",
            alt: "Location Map"
        }
    ];

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    return (
        <section className="py-20 bg-background text-paper relative" id="story">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                <div className="w-full md:w-1/2 relative group">
                    <div className="aspect-[4/5] bg-paper rounded-lg rotate-2 border-4 border-white shadow-2xl p-4 transform transition-transform hover:rotate-0 relative overflow-hidden">

                        {/* Carousel Content */}
                        <div className="w-full h-full relative bg-gray-200 overflow-hidden">
                            {slides[currentSlide].type === 'image' ? (
                                <img
                                    src={slides[currentSlide].content}
                                    alt={slides[currentSlide].alt}
                                    className="object-cover w-full h-full grayscale hover:grayscale-0 transition-all duration-700"
                                />
                            ) : (
                                <iframe
                                    width="100%"
                                    height="100%"
                                    src={slides[currentSlide].content}
                                    frameBorder="0"
                                    scrolling="no"
                                    marginHeight={0}
                                    marginWidth={0}
                                    title="Google Maps"
                                    className="w-full h-full filter grayscale hover:grayscale-0 transition-all duration-700"
                                ></iframe>
                            )}
                        </div>

                        {/* Navigation Buttons */}
                        <button
                            onClick={(e) => { e.stopPropagation(); prevSlide(); }}
                            className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-text p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={(e) => { e.stopPropagation(); nextSlide(); }}
                            className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-text p-2 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10"
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
                    <div className="space-y-6 font-main text-lg leading-relaxed text-white/90">
                        <p>
                            Tại <b>Bún Bò & Cà Phê Phố</b>, chúng tôi không "công nghiệp hóa" món ăn. Nước dùng được ninh 24h từ xương ống, thịt bò được tuyển chọn kỹ lượng mỗi sáng sớm.
                        </p>
                        <p>
                            Đến đây, bạn không chỉ ăn ngon, mà còn là sống lại những ký ức đẹp đẽ của một thời "Ông Bà Anh".
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
                            onClick={() => setCurrentSlide(1)}
                        >
                            <div className="font-display text-4xl text-secondary flex justify-center items-center gap-1">
                                <MapPin size={32} />
                            </div>
                            <div className="text-sm opacity-80 underline decoration-dashed">Xem Bản Đồ</div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
