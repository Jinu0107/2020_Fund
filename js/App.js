const log = console.log;
let app;

window.addEventListener("load", () => {
    app = new App();
});


// 질문 리스트
// 1. 기본적으로 제공되는 json은 날짜가 모두 지나있는 상태인데 이거는 처음 메인페이지에서 보여주어야 하나
// 2. 푸터의 기준이란
// 3. 만약 메인화면(펀드보기 페이지)을 보고있는도중 펀드에서 설정한 시간을 넘었을 경우 이때는 어떻게 해야하나
// 4. 



class App {
    constructor() {
        this.json;
        this.datas;
        this.is_sliding = false;
        // this.$now_page = $('.main_page');
        // this.$now_page = $('.fund_register_page');
        this.$now_page = $('.view_fund_page');
        this.$now_page.show();
        this.$now_page.data("idx", 0);
        this.$item_box = $(".main_page .item_box");
        this.$nav_btns = $('body > div > header > div.li_box.flex.flex_d.flex_b > div.fw_500');
        log(this.$item_box);
        this.show_visual = true;
        this.page_idx = 0;
        this.init();
    }

    async init() {
        this.json = await this.getJSON();
        this.datas = this.getDatas();
        this.sortDatas();
        log(this.datas)
        this.setVisualAnimation();
        this.loadMainPage();
        this.setEvent();
    }


    setEvent() {
        this.$nav_btns.on("click", (e) => {
            if (this.is_sliding) return;
            this.is_sliding = true;
            let target = e.currentTarget.dataset.target;
            $('header .on').removeClass('on');
            e.currentTarget.classList.toggle('on');
            this.movePage(target);
        });

        //펀드등록 페이지 시작
        $('.fund_register_page .fund_total').on("input", (e) => {
            let value = e.currentTarget.value;
            value = value.replaceAll(/[^0-9]/g, "");
            e.currentTarget.value = value;
        });

        $('.fund_register_page .submit_btn').on("click", () => {
            let name = xss($('.fund_register_page .fund_name').val().trim());
            let date = xss($('.fund_register_page .fund_date').val().trim());
            date = date.replaceAll("T", " ");
            let total = xss($('.fund_register_page .fund_total').val().trim());
            let number = xss($('.fund_register_page .fund_total').val().trim());
            if (name == "" || date == "" || total == "") {
                alert("필수값이 비어있습니다.");
                return;
            }
            let obj = {
                "current": 0,
                "endDate": date,
                "name": name,
                "number": number,
                "total": total,
                "percent": Math.ceil((0 / total * 100) * 100) / 100,
                "str_current": 0,
                "str_total": (total * 1).toLocaleString()
            };
            this.datas.push(obj);
            this.loadFundRegisterPage();
            log(this.datas);
        });

        //펀드 등록 페이지 끝
    }

    movePage(idx) {
        let top = this.$now_page.height();
        let now_idx = this.$now_page.data("idx");
        if (now_idx == idx) {
            this.is_sliding = false
            return;
        }
        let next_page = $('.section_container .section').eq(idx);
        next_page.show().css('top', top + "px").animate({ 'top': 0 + "px" }, 1000);
        this.$now_page.animate({ 'top': -top + "px" }, 1000).fadeOut(1);
        this.$now_page = next_page;
        this.$now_page.data('idx', idx);
        setTimeout(() => { this.is_sliding = false }, 1000);

        if (idx == 0) this.loadMainPage();
        else if (idx == 1) this.loadFundRegisterPage();
        else if (idx == 2) this.loaViewFundPage();
        else if (idx == 3) this.loadInvstorListPage();
    }

    loadFundRegisterPage() {
        let ran_str = this.getRandomString();
        $('.fund_register_page .fund_num').html(ran_str);
        $('.fund_register_page input').val('');
    }
    loaViewFundPage() {
        $('.view_fund_page .item_box').empty();
        this.datas.forEach(item => {
            $('.view_fund_page .item_box').append(this.makeFundDom(item));
        });
        this.datas.forEach((item, idx) => {
            setTimeout(() => {
                $('.view_fund_page .item .bar').eq(idx).animate({ "width": item.percent + "%" }, 3000);
            }, 700);
        });

    }

    makeFundDom(item) {
        return `
                    <div class="item">
                            <img src="images/optimize.jpg" alt="">
                            <div class="name" alt="${item.name}">
                               ${item.name}
                            </div>
                            <div class="percent flex flex_a_c">
                                ${item.percent}% <span class="m_l_10 color_aaa font_13 fw_500" alt="${item.str_total}원 / ${item.str_current}원">${item.str_total}원 / ${item.str_current}원</span>
                            </div>
                            <div class="color_aaa font_13 fw_500"><span class="color_777 fw_600">종료일 - </span>${item.endDate}</div>
                            <div class="btn_group flex flex_e">
                                <div class="status_btn flex flex_c on">투자하기</div>
                            </div>
                            <hr class="bar"></hr>
                        </div>
        `
    }

    loadInvstorListPage() {

    }

    getRandomString() {
        let f = String.fromCharCode(Math.floor(Math.random() * 26) + 65);
        let n = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
        return f + n;
    }

    sortDatas() {
        this.datas.sort((a, b) => {
            return a.percent < b.percent ? 1 : a.percent > b.percent ? -1 : 0;
        });
    }

    getDatas() {
        return this.json.map(item => {
            return {
                "number": item.number,
                'name': item.name,
                'endDate': item.endDate,
                'total': item.total,
                'current': item.current,
                'str_current': item.current.toLocaleString(),
                'str_total': item.total.toLocaleString(),
                'percent': Math.ceil((item.current / item.total * 100) * 100) / 100
            }
        });
    }

    loadMainPage() {
        this.sortDatas();
        let view_list = this.datas.slice(0, 4);
        for (let i = 0; i < 4; i++) {
            this.$item_box.find('.item').eq(i).find('div').eq(0).html(view_list[i].percent + "%");
            this.$item_box.find('.item').eq(i).find('div').eq(1).html(view_list[i].name);
            this.$item_box.find('.item').eq(i).find('div').eq(2).html("종료일 - " + view_list[i].endDate);
            this.$item_box.find('.item').eq(i).find('div').eq(3).html(view_list[i].str_current + "원 펀딩");
        }

        $('.main_page .text').hide().fadeIn(2000);
        $('.main_page .item0').css('margin-left', '-300px').animate({ 'margin-left': 0 }, 750,);
        $('.main_page .item1').css('margin-left', '-600px').animate({ 'margin-left': 0 }, 1500,);
        $('.main_page .item3').css('margin-top', '-300px').animate({ 'margin-top': 0 }, 750,);
        $('.main_page .item4').css('margin-left', '-600px').animate({ 'margin-left': 0 }, 750,);
    }


    setVisualAnimation() {
        setInterval(() => {
            if (this.show_visual) {
                $('.main_page .visual .on').fadeOut(1000);
                this.show_visual = false;
            } else {
                $('.main_page .visual .on').fadeIn(1000);
                this.show_visual = true;
            }
        }, 4000);
    }

    getJSON() {
        return $.getJSON('/js/fund.json');
    }
}


window.xss = function (str) {

    let items = [
        ["<", "&lt;"],
        [">", "&gt;"],
        ["&", "&amp;"]
    ];
    items.forEach(x => {
        log(str);
        str = str.replaceAll(x[0], x[1]);
    });
    return str;
}
