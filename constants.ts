
export interface PronounStyleConfig {
    pronouns: string;
    relations: string;
    blacklist: string;
    tone: string;
    notes?: string;
}

export interface PronounStyleDef {
    id: string;
    label: string;
    description: string;
    config?: PronounStyleConfig; // undefined for 'custom'
}

export const compilePronounStyle = (styleName: string, config?: PronounStyleConfig): string => {
    if (!config) return "";
    return `
!!! GIAO THỨC XƯNG HÔ (PRONOUN PROTOCOL): [${styleName.toUpperCase()}] !!!
Hệ thống AI BẮT BUỘC tuân thủ các quy tắc sau đây để đảm bảo tính nhất quán của thế giới:

1. HỆ THỐNG ĐẠI TỪ (MANDATORY PRONOUNS):
${config.pronouns}

2. QUAN HỆ XÃ HỘI & VAI VẾ (HIERARCHY):
${config.relations}

3. TỪ ĐIỂN CẤM (BLACKLIST) - TUYỆT ĐỐI KHÔNG DÙNG:
${config.blacklist}
⚠️ LƯU Ý QUAN TRỌNG: Nếu bối cảnh là Cổ Đại / Phương Tây / Tu Tiên / Chủ-Nô:
- CẤM TUYỆT ĐỐI dùng "Anh/Em" (Trừ khi là loạn luân ruột thịt hoặc bối cảnh hiện đại hóa).
- CẤM TUYỆT ĐỐI dùng "Cậu/Tớ/Mình".

4. KHÔNG KHÍ HỘI THOẠI (TONE):
${config.tone}
${config.notes ? `\n5. GHI CHÚ ĐẶC BIỆT & SỬA LỖI (CRITICAL FIXES):\n${config.notes}` : ''}`;
};

export const PRONOUN_STYLES: PronounStyleDef[] = [
    {
        id: "tien_hiep",
        label: "Tiên Hiệp / Tu Chân (Cổ Điển)",
        description: "Đạo hữu, Bần đạo, Tại hạ. Trang trọng, cổ kính.",
        config: {
            pronouns: `   - Ngôi 1 (Tự xưng): Tại hạ / Bần đạo (Đạo sĩ) / Lão phu (Già) / Bổn tọa (Cao nhân) / Ta / Đệ / Muội.
   - Ngôi 2 (Gọi người khác): Đạo hữu / Các hạ / Tiên tử (Nữ) / Tiểu hữu (Trẻ) / Ngươi / Huynh đài.
   - Sư môn: Sư phụ / Đồ nhi / Sư huynh / Sư muội / Sư thúc / Lão tổ.`,
            relations: `   - Kẻ mạnh là tôn. Cảnh giới cao hơn là Tiền bối.
   - Vợ chồng gọi là "Đạo lữ" (Phu quân / Nương tử).`,
            blacklist: `   - CẤM: "Anh/Em/Cậu/Tớ/Chị" (Kiểu hiện đại).
   - CẤM: "Bố/Mẹ" (Phải dùng Phụ thân/Mẫu thân).
   - CẤM: "Vợ/Chồng" (Dùng Nương tử/Phu quân/Đạo lữ).`,
            tone: `   - Hán Việt nặng. Lạnh lùng, xa cách, mang màu sắc cầu đạo.`,
            notes: `   - Nữ tu sĩ nói chuyện với nhau xưng Tỷ/Muội hoặc Đạo hữu. KHÔNG xưng "Thần thiếp" trừ khi nói với chồng.`
        }
    },
    {
        id: "huyen_huyen",
        label: "Huyền Huyễn (Đại Lục/Dị Giới)",
        description: "Ta/Ngươi, Các hạ. Mạnh được yếu thua.",
        config: {
            pronouns: `   - Chung: Ta - Ngươi (Phổ biến nhất).
   - Kính ngữ: Đại nhân / Các hạ / Tôn giả / Thánh giả.
   - Khinh miệt: Tiểu tử / Phế vật / Ngươi.`,
            relations: `   - Phân chia theo Gia tộc (Tộc trưởng/Thiếu chủ) hoặc Tông môn.`,
            blacklist: `   - CẤM: "Bần đạo/Thí chủ" (Trừ khi là nhân vật Phật/Đạo đặc thù).
   - CẤM: "Anh/Em".`,
            tone: `   - Bá đạo, ngạo nghễ, trực diện. Ít dùng từ Hán Việt cổ hơn Tiên Hiệp.`
        }
    },
    {
        id: "kiem_hiep",
        label: "Kiếm Hiệp / Giang Hồ",
        description: "Huynh đài, Cô nương, Tại hạ. Hào sảng.",
        config: {
            pronouns: `   - Xã giao: Tại hạ / Các hạ / Huynh đài / Cô nương / Vị huynh đệ này.
   - Thân mật: Ta / Ngươi / Đệ / Ca / Muội.
   - Tự xưng ngông: Lão tử / Gia / Ông đây.`,
            relations: `   - Tứ hải giai huynh đệ. Trọng nghĩa khí giang hồ.`,
            blacklist: `   - CẤM: "Anh/Em" (Trừ khi là tình nhân thắm thiết).
   - CẤM: "Sếp/Đại ca" (Dùng Lão đại/Đại đương gia).`,
            tone: `   - Bụi bặm, phong trần, khẩu khí lớn, dùng nhiều tiếng lóng giang hồ cổ.`
        }
    },
    {
        id: "sac_hiep_tho",
        label: "Sắc Hiệp (Thô Lỗ / Hardcore / Chủ-Nô)",
        description: "Chủ nhân - Nô. Dùng cho BDSM/Hardcore.",
        config: {
            pronouns: `   - Nam (Chủ/Dom): Lão tử / Ông đây / Gia / Ta / Chủ nhân (Master).
   - Nữ (Nô/Sub): Nô / Nô gia / Tiện nô / Con / Em (chỉ dùng khi rất thân mật).
   - Gọi đối phương (Khinh miệt): Ả / Tiện nhân / Con đĩ / Con chó cái / Vật chứa tinh.
   - Gọi bộ phận cơ thể: Dùng từ trần trụi (Côn thịt, Hoa huyệt, Dâm thủy, Lỗ lồn).`,
            relations: `   - Nam tôn nữ ty. Chiếm hữu, cưỡng ép hoặc phục tùng tuyệt đối.
   - QUAN TRỌNG: Nếu nhân vật nữ ở vai vế thấp (nô lệ, tù nhân), BẮT BUỘC xưng là "Nô / Tiện nô / Con", gọi Nam là "Chủ nhân / Ngài". KHÔNG ĐƯỢC xưng "Em" gọi "Anh".`,
            blacklist: `   - CẤM: Văn phong quá lịch sự, khách sáo.
   - CẤM: "Anh/Em" (Trong bối cảnh cưỡng ép/cổ đại).`,
            tone: `   - Thô bạo, tục tĩu (Dirty talk), kích thích bản năng, không che đậy.`
        }
    },
    {
        id: "sac_hiep_mem",
        label: "Sắc Hiệp (Gợi Cảm / Văn Nhã)",
        description: "Chàng/Nàng, Y/Hắn. Miêu tả hoa mỹ, ướt át.",
        config: {
            pronouns: `   - Cặp đôi: Chàng - Nàng / Ta - Nàng / Huynh - Muội.
   - Mô tả: Y / Hắn / Nữ nhân kia / Giai nhân.
   - Gọi bộ phận: Dùng từ ẩn dụ (Ngọc phong, Đào nguyên, Cự long, Mật dịch).`,
            relations: `   - Tình cảm lãng mạn pha lẫn nhục dục.`,
            blacklist: `   - CẤM: Từ ngữ quá thô tục chợ búa (Vd: C*c, L*n).`,
            tone: `   - Ướt át, dâm mị nhưng dùng từ hoa mỹ, tập trung vào cảm xúc và vẻ đẹp cơ thể.`
        }
    },
    {
        id: "cung_dau",
        label: "Cung Đấu / Hoàng Gia",
        description: "Trẫm, Thần thiếp, Nô tì. Tôn ti trật tự.",
        config: {
            pronouns: `   - Vua (Nam/Nữ Đế): Trẫm / Cô gia / Quả nhân.
   - Hậu phi (Vợ vua): Thần thiếp / Bổn cung (Chủ vị) / Tỷ tỷ / Muội muội.
   - QUAN VÕ/TƯỚNG QUÂN (Bất kể nam nữ): Thần / Vi thần / Mạt tướng / Hạ quan / Tên.
   - Nô tì/Thái giám: Nô tài / Nô tì / Lão nô.`,
            relations: `   - Tôn ti trật tự cực kỳ nghiêm ngặt.`,
            blacklist: `   - CẤM TUYỆT ĐỐI: "Vợ/Chồng/Anh/Em".
   - CẤM: "Tôi/Bạn/Mày/Tao".`,
            tone: `   - Trang trọng, thâm sâu, lời nói ẩn ý.`,
            notes: `   - CẢNH BÁO LỖI LOGIC:
     1. Nữ Tướng Quân / Nữ Quan nói chuyện với Vua/Nữ Hoàng: Phải xưng là "Thần" / "Vi thần" / "Mạt tướng". TUYỆT ĐỐI KHÔNG xưng "Thần thiếp" (Thần thiếp = Vợ vua).
     2. Nữ Hoàng nói với Nữ Tướng: Gọi "Khanh" / "Ái khanh" / [Tên/Chức vụ].`
        }
    },
    {
        id: "ngon_tinh_co",
        label: "Ngôn Tình (Cổ Đại)",
        description: "Chàng/Nàng, Thiếp/Ta. Lãng mạn cổ trang.",
        config: {
            pronouns: `   - Nam: Ta / Chàng / Huynh / Vương gia / Tướng công.
   - Nữ: Ta / Nàng / Muội / Thiếp (chỉ xưng với chồng/người yêu) / Nương tử.
   - Tên gọi: [Tên] ca ca / [Tên] nhi.`,
            relations: `   - Tập trung vào tình yêu nam nữ. Sủng ngọt hoặc Ngược tâm.`,
            blacklist: `   - CẤM TUYỆT ĐỐI: "Anh/Em" (Trừ khi là truyện xuyên không hiện đại hóa).`,
            tone: `   - Nhẹ nhàng, sướt mướt, hoa mỹ, thơ ca.`,
            notes: `   - Nếu chưa cưới/chưa yêu: Nữ xưng "Ta - Huynh/Công tử", KHÔNG xưng "Thiếp". "Thiếp" là cách xưng hô của thê tử hoặc người đã xác định quan hệ.`
        }
    },
    {
        id: "ngon_tinh_hien_dai",
        label: "Ngôn Tình (Hiện Đại / Tổng Tài)",
        description: "Anh/Em, Tôi/Cô. Bá đạo tổng tài.",
        config: {
            pronouns: `   - Nam: Tôi / Anh (Thân mật).
   - Nữ: Cô / Em (Thân mật).
   - Xưng hô lạnh lùng: [Họ Tên] / Người phụ nữ này.`,
            relations: `   - Tổng tài - Lọ lem. Oan gia ngõ hẹp.`,
            blacklist: `   - CẤM: "Tại hạ/Huynh đài".`,
            tone: `   - Hiện đại, sang chảnh, hoặc oan gia hài hước.`
        }
    },
    {
        id: "fantasy_western",
        label: "Phương Tây (Lãnh Chúa / Nô Lệ)",
        description: "Ngài, Nô, Ta/Ngươi. Phong cách dịch giả/Isekai.",
        config: {
            pronouns: `   - Quý tộc/Chủ nhân: Ngài (My Lord) / Phu nhân (My Lady) / Chủ nhân (Master).
   - Nô lệ/Hầu gái (Submissive): Nô / Tôi / Kẻ hèn này / Tiện tì (nữ) / [Tên].
   - Ngang hàng/Kẻ thù: Ta - Ngươi (I - You).
   - Ngôi 3: Hắn / Gã / Y / Nàng / Ả.`,
            relations: `   - Lãnh chúa - Hiệp sĩ - Dân thường - Nô lệ.
   - QUAN TRỌNG: Người địa vị thấp (Nô lệ/Hầu gái) KHÔNG ĐƯỢC xưng "Em", phải xưng "Nô/Tôi".`,
            blacklist: `   - CẤM: "Anh/Em/Chị" (Kiểu Việt Nam thân mật).
   - CẤM: "Đại ca/Sư phụ/Huynh đài" (Kiểu Tàu).`,
            tone: `   - Trang trọng kiểu Châu Âu trung cổ, văn học dịch.`
        }
    },
    {
        id: "do_thi_giang_ho",
        label: "Đô Thị (Giang Hồ / Xã Hội Đen)",
        description: "Đại ca, Lão đại, Mày/Tao. Bụi bặm hiện đại.",
        config: {
            pronouns: `   - Đại ca: Lão đại / Đại ca / Anh Hai.
   - Đàn em: Mày / Tao / Thằng nhóc / Chú em.
   - Kẻ thù: Thằng chó / Mày / Tao.`,
            relations: `   - Huynh đệ xã hội, băng đảng.`,
            blacklist: `   - CẤM: Từ ngữ quá văn vẻ, sến súa.`,
            tone: `   - Chợ búa, thô tục, dùng tiếng lóng hiện đại, cục súc.`
        }
    },
    {
        id: "he_thong_game",
        label: "Võng Du / Hệ Thống (Gamer)",
        description: "Người chơi, Ký chủ, Main. Giao diện Game.",
        config: {
            pronouns: `   - Hệ thống gọi Main: Ký chủ / Người chơi (Player) / Ngài.
   - Main gọi Hệ thống: Hệ thống / Mày / Ngươi.
   - Người chơi với nhau: Ông/Tôi, Bác/Tôi, Anh em (Bro).`,
            relations: `   - Game thủ, Guild, Party.`,
            blacklist: `   - CẤM: Văn phong quá cổ trang (Trừ khi là game Kiếm hiệp).`,
            tone: `   - Hiện đại, hài hước, dùng thuật ngữ game (Level, HP, MP, Boss, Farm).`
        }
    },
    {
        id: "anime_jp",
        label: "Anime / Light Novel (Nhật Bản)",
        description: "Cậu/Tớ, Onii-chan, Sensei. Văn phong Nhật.",
        config: {
            pronouns: `   - Bạn bè: Cậu - Tớ / Cậu - Mình.
   - Kính ngữ: [Tên]-san / [Tên]-kun / [Tên]-chan / Senpai / Sensei / Sama.
   - Gia đình: Anh hai (Onii-chan) / Chị hai (Onee-chan) / Otou-san / Okaa-san.`,
            relations: `   - Học đường, hội học sinh, mạo hiểm giả.`,
            blacklist: `   - CẤM: "Tại hạ/Các hạ".
   - CẤM: "Mày/Tao" (Trừ khi là Yakuza hoặc nhân vật thô lỗ).`,
            tone: `   - Dễ thương, nhiều từ tượng thanh, độc thoại nội tâm, biểu cảm cường điệu.`
        }
    },
    {
        id: "custom",
        label: "Tùy chỉnh (Thủ công)",
        description: "Tự nhập quy tắc riêng...",
        config: undefined
    }
];
