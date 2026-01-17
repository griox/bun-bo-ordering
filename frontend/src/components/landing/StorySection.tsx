'use client';

export function StorySection() {
    return (
        <section className="py-20 bg-background text-paper relative">
            <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-12">
                <div className="w-full md:w-1/2 relative">
                    <div className="aspect-[4/5] bg-paper rounded-lg rotate-2 border-4 border-white shadow-2xl p-4 transform transition-transform hover:rotate-0">
                        {/* Placeholder for Story Image - using a coffee shop / food vibe */}
                        <div className="w-full h-full bg-gray-200 overflow-hidden relative grayscale hover:grayscale-0 transition-all duration-700">
                            <img
                                src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-1.2.1&auto=format&fit=crop&w=800&q=80"
                                alt="Our Story"
                                className="object-cover w-full h-full"
                            />
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
                    </div>
                </div>
            </div>
        </section>
    );
}
