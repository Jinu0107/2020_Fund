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
        this.$now_page = $('.main_page');
        // this.$now_page = $('.fund_register_page');
        // this.$now_page = $('.view_fund_page');
        // this.$now_page = $('.investor_list_page');
        this.$now_page.show();
        this.$now_page.data("idx", 0);
        this.$item_box = $(".main_page .item_box");
        this.$nav_btns = $('body > div > header > div.li_box.flex.flex_d.flex_b > div.fw_500');
        this.show_visual = true;
        this.page_idx = 0;
        this.$popup = $('.popup');
        this.canvas = this.$popup.find('canvas')[0];
        this.canvas.width = 530;
        this.canvas.height = 200;
        this.ctx = this.canvas.getContext("2d");
        this.pos = {
            click: false,
            x: -1,
            y: -1
        }
        this.investor_list = [];
        this.$tbody = $('.investor_list_page tbody');
        this.$tbody.data("page", 1);
        this.draw_ok = false;
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
            let number = xss($('.fund_register_page .fund_num').html().trim());
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
        });

        //펀드 등록 페이지 끝

        //펀드 포기 페이지 시작

        $(document).on("click", ".view_fund_page .item .on", (e) => {
            let num = e.currentTarget.dataset.num;
            let data = this.datas.find(x => x.number == num);
            this.$popup.find('.investment_num').html(data.number);
            this.$popup.find('.investment_name').val(data.name);
            this.$popup.find('.investment_user').val('');
            this.$popup.find('.investment_total').val('');
            this.$popup.find('.investment_total')[0].dataset.total = data.total;
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.$popup.fadeIn();
        });

        this.$popup.on("click", ".side_box > i", () => {
            this.$popup.fadeOut();
            this.draw_ok = false;
        });

        this.$popup.find('.investment_total').on('input', (e) => {
            let total = e.currentTarget.dataset.total;
            log(total);
            let value = e.currentTarget.value;
            value = value.replaceAll(/[^0-9]/g, "") * 1;
            if (value >= total) {
                e.currentTarget.value = total;
            } else {
                e.currentTarget.value = value;
            }
        });

        this.$popup.on("click", ".investment_btn", () => {
            let number = xss(this.$popup.find('.investment_num').html().trim());
            let name = xss(this.$popup.find('.investment_name').val().trim());
            let user = xss(this.$popup.find('.investment_user').val().trim());
            let total = xss(this.$popup.find('.investment_total').val().trim()) * 1;
            let default_total = total;
            log(number, name, user, total);
            if (number == "" || name == "" || user == "" || total == "" || !this.draw_ok) {
                alert("필수값이 비었다");
                return;
            }
            if (total <= 0) {
                alert("금액은 1원 이상으로 설정하실 수 있습니다");
                return;
            }
            log(this.datas);
            this.datas.forEach(x => {
                if (x.number == number) {
                    total += x.current;
                    x.current = total;
                    x.str_current = total.toLocaleString();
                    x.percent = Math.ceil((total / x.total * 100) * 100) / 100;
                }
            });

            let data = this.investor_list.find(x => x.number == number && x.name == user);
            let item_data = this.datas.find(x => x.number == number);
            if (data === undefined) {
                let obj = {
                    number: number,
                    fund_name: name,
                    name: user,
                    total: default_total,
                    percent: Math.ceil((default_total / item_data.total * 100) * 100) / 100,
                    str_total: default_total.toLocaleString(),
                    img: this.canvas.toDataURL(),
                }
                this.investor_list.unshift(obj);
            } else {
                data.total = data.total + default_total;
                data.str_total = data.total.toLocaleString();
                data.percent = Math.ceil((data.total / item_data.total * 100) * 100) / 100;
                data.img = this.canvas.toDataURL();
            }
            log(this.investor_list);
            this.$popup.fadeOut();
            this.loaViewFundPage();



        });

        this.$popup.on("mouseup", "canvas", () => {
            this.pos.click = false;
            this.pos.x = -1;
            this.pos.y = -1;
        });
        this.$popup.on("mousedown", "canvas", (e) => {
            this.ctx = this.canvas.getContext("2d");
            this.ctx.beginPath();
            this.pos.click = true;
            this.pos.x = e.offsetX;
            this.pos.y = e.offsetY;
            this.ctx.moveTo(this.pos.x, this.pos.y);

        });
        this.$popup.on("mousemove", "canvas", (e) => {
            if (!this.pos.click) return;
            this.draw_ok = true;
            this.ctx = this.canvas.getContext("2d");
            let x = e.offsetX;
            let y = e.offsetY;
            this.ctx.lineTo(x, y);
            this.pos.x = x;
            this.pos.y = y;
            this.ctx.stroke();
        });

        this.$popup.on("mouseout", "canvas", () => {
            this.pos.click = false;
        });


        //펀드 포기 페이지 끝


        //투자자목록 시작
        $('.pagination_group').on("click", ".num", (e) => {
            let page = e.currentTarget.dataset.page;
            this.$tbody.data("page", page);
            this.loadInvstorListPage();
        });



        //투자자 목록 끝

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
        this.sortDatas();
        $('.view_fund_page .item_box').empty();
        let date = new Date();
        this.datas.forEach(item => {
            let endDate = new Date(item.endDate);
            item.status = date < endDate ? true : false
            $('.view_fund_page .item_box').append(this.makeFundDom(item));
        });
        this.datas.forEach((item, idx) => {
            setTimeout(() => {
                $('.view_fund_page .item .bar').eq(idx).animate({ "width": item.percent < 100 ? item.percent + "%" : "100" + "%" }, 3000);
            }, 700);
        });

    }

    makeFundDom(item) {
        return `
                    <div class="item">
                            <img src="images/optimize.jpg" alt="">
                            <span class="number">${item.number}</span>
                            <div class="name" title="${item.name}">
                               ${item.name}
                            </div>
                            <div class="percent flex flex_a_c">
                                ${item.percent}% <span class="m_l_10 color_aaa font_13 fw_500" title="${item.str_total}원 / ${item.str_current}원">${item.str_total}원 / ${item.str_current}원</span>
                            </div>
                            <div class="color_aaa font_13 fw_500"><span class="color_777 fw_600">종료일 - </span>${item.endDate}</div>
                            <div class="btn_group flex flex_e">
                                <div class="status_btn flex flex_c m_t_10 ${item.status ? 'on' : ''}" data-num="${item.number}">${item.status ? '투자하기' : '모집완료'}</div>
                            </div>
                            <hr class="bar"></hr>
                        </div>
        `
    }

    loadInvstorListPage() {
        this.$tbody.fadeOut(500);
        setTimeout(() => {
            let page = this.$tbody.data("page") * 1;
            const ITEM_COUNT = 5;
            const BTN_COUNT = 5;

            let total_page = Math.ceil(this.investor_list.length / ITEM_COUNT);
            total_page = total_page == 0 ? 1 : total_page;
            let current_block = Math.ceil(page / BTN_COUNT);

            let start = current_block * BTN_COUNT - BTN_COUNT + 1;
            start = start < 1 ? 1 : start;
            let end = start + BTN_COUNT - 1;
            end = end > total_page ? total_page : end;
            let prev = start > 1;
            let next = end < total_page;

            let start_idx = (page - 1) * ITEM_COUNT;
            let end_idx = start_idx + ITEM_COUNT;
            let view_list = this.investor_list.slice(start_idx, end_idx);
            let htmlBtns = `<div class="num ${prev ? '' : 'disable'}" data-page="${start - 1 > 1 ? start - 1 : 1}"><i class="fas fa-chevron-left"></i></div>`;
            for (let i = start; i <= end; i++) {
                htmlBtns += `<div class="num ${page == i ? 'active' : ''}" data-page="${i}">${i}</div>`;
            }
            htmlBtns += ` <div class="num ${next ? '' : 'disable'}" data-page="${end + 1 < total_page ? end + 1 : total_page}"><i class="fas fa-chevron-right"></i></div>`;
            $(".pagination_group").html(htmlBtns);
            this.$tbody.empty();
            view_list.forEach(x => {
                let dom = document.createElement('tr');
                dom.innerHTML = this.makeInvestorDom(x);
                this.$tbody.append(dom);
                this.domEvent(dom);
            });

            this.$tbody.fadeIn();
        }, 500);


    }


    domEvent(dom) {
        $(dom).on("click", ".load_img_btn", (e) => {

            let number = e.currentTarget.dataset.num;
            let name = e.currentTarget.dataset.name;
            let data = this.investor_list.find(x => x.number == number && x.name == name);
            let sign = new Image(300, 120);
            sign.src = data.img;
            sign.addEventListener('load', () => {
                let funding_img = new Image(793, 495);
                funding_img.src = "./images/funding.png";
                funding_img.addEventListener("load", () => {
                    let canvas = document.createElement("canvas");
                    let ctx = canvas.getContext("2d");
                    canvas.width = 793;
                    canvas.height = 495;
                    ctx.drawImage(funding_img, 0, 0);
                    ctx.drawImage(sign, 480, 350, 300, 120);
                    ctx.font = "18px noto";
                    ctx.fillText(data.number, 330, 180);
                    ctx.fillText(data.fund_name, 330, 230);
                    ctx.fillText(data.name, 330, 270);
                    ctx.fillText(data.str_total, 330, 330);
                    let url = canvas.toDataURL();
                    let a = document.createElement('a');
                    a.href = url;
                    a.download = `${data.name}님 투자펀딩계약서`;
                    a.click();
                });
            });
        });
    }

    makeInvestorDom(x) {
        return `
                                <td class="fw_500">${x.number}</td>
                                <td class="fw_500 text_over" title="${x.fund_name}">${x.fund_name}</td>
                                <td class="fw_500 text_over" title="${x.name}">${x.name}</td>
                                <td class="fw_500 text_over" title="${x.str_total}원">${x.str_total}원</td>
                                <td class="fw_500 text_over" title="${x.percent}%">${x.percent}%</td>
                                <td class="fw_500 text_over">
                                    <div class="load_img_btn" data-num="${x.number}" data-name="${x.name}">투자펀드계약서</div>
                                </td>
        `
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
                'name': json_xss(item.name),
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
        let view_list = this.datas.filter(x => new Date() < new Date(x.endDate));
        log(view_list);
        for (let i = 0; i < 4; i++) {
            this.$item_box.find('.item').eq(i).find('div').eq(0).html(view_list[i].percent + "%");
            this.$item_box.find('.item').eq(i).find('div').eq(1).html(view_list[i].name);
            this.$item_box.find('.item').eq(i).find('div').eq(1).attr("title", view_list[i].name);
            this.$item_box.find('.item').eq(i).find('div').eq(2).html("종료일 - " + view_list[i].endDate);
            this.$item_box.find('.item').eq(i).find('div').eq(3).html(view_list[i].str_current + "원 펀딩");
            this.$item_box.find('.item').eq(i).find('div').eq(3).attr("title", view_list[i].str_current + "원 펀딩");
        }

        $('.main_page .text').hide();
        $('.main_page .item0').css('margin-left', '-300px');
        $('.main_page .item1').css('margin-left', '-600px');
        $('.main_page .item3').css('margin-top', '-300px');
        $('.main_page .item4').css('margin-left', '-600px');
        setTimeout(() => {
            $('.main_page .text').fadeIn(2000)
            $('.main_page .item0').animate({ 'margin-left': 0 }, 750, );
            $('.main_page .item1').animate({ 'margin-left': 0 }, 1500, );
            $('.main_page .item3').animate({ 'margin-top': 0 }, 750, );
            $('.main_page .item4').animate({ 'margin-left': 0 }, 750, );
        }, 500);
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


window.xss = function(str) {

    let items = [
        ['&', '&amp'],
        ["<", "&lt;"],
        [">", "&gt;"],
        ['\n', '\\n']
    ];
    items.forEach(x => {
        str = str.replaceAll(x[0], x[1]);
    });
    return str;
}

window.json_xss = function(str) {

    let items = [
        ['&', '&amp'],
        ["<", "&lt;"],
        [">", "&gt;"],
        ['\n', '<br>']
    ];
    items.forEach(x => {
        str = str.replaceAll(x[0], x[1]);
    });
    return str;
}