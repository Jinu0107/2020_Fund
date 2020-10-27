const log = console.log;
let app;

window.addEventListener("load", () => {
    app = new App();
});

class App {
    constructor() {
        this.json;
        this.datas;
        this.is_sliding = false;
        this.$now_page = $('.main_page');
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
    }

    movePage(idx) {
        let top = this.$now_page.height();
        let next_page = $('.section_container .section').eq(idx);
        log(next_page);
        next_page.css('top', top + "px");
        setTimeout(() => {
            next_page.animate({ 'top': 0 }, 1000);
            this.$now_page.animate({ 'top': -top + "px" }, 1000);
            this.$now_page = next_page;
            setTimeout(() => { this.is_sliding = false }, 1000);
        }, 1);

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

        $('.main_page .item0').css('margin-left', '-300px');
        $('.main_page .item1').css('margin-left', '-600px');
        $('.main_page .item3').css('margin-top', '-300px');
        $('.main_page .item4').css('margin-left', '-600px');
        setTimeout(() => {
            $('.main_page .item0').animate({ 'margin-left': 0 }, 650,);
            $('.main_page .item1').animate({ 'margin-left': 0 }, 1300,);
            $('.main_page .item3').animate({ 'margin-top': 0 }, 650,);
            $('.main_page .item4').animate({ 'margin-left': 0 }, 650,);
        }, 1);
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
