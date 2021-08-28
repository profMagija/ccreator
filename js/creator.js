const c_orders = 'bg br gu gw rg rw ub ur wb wu'.split(' ');

function to_order(str) {
    if (c_orders.includes(str))
        return str;
    else
        return str[1] + str[0];
}

function img_elem(src, x, y, w, h) {
    const elem = document.createElement('div');
    Object.assign(elem.style, {
        position: 'absolute',
        left: x ? x + 'px' : '0',
        top: y ? y + 'px' : '0',
        width: w ? w + 'px' : '100%',
        height: h ? h + 'px' : '100%',
        backgroundImage: `url('${src}')`,
    });
    elem.src = src;
    return elem;
}

function force_width(elem, width) {
    const scaleFactor = width / elem.offsetWidth;
    elem.style.transform = `scaleX(${scaleFactor}) translateX(${-elem.offsetWidth * (1-scaleFactor) / 2 / scaleFactor}px)`
}

function fit_elem_to_width(elem, maxWidth) {
    elem.style.whiteSpace = 'nowrap';
    if (elem.offsetWidth > maxWidth) {
        force_width(elem, maxWidth);
    }
}

function text_elem(text, x, y, font, size) {
    const elem = document.createElement('div');
    Object.assign(elem.style, {
        position: 'absolute',
        left: x ? x + 'px' : '0',
        top: y ? y + 'px' : '0',
        padding: '0',
        margin: '0',
        fontFamily: font,
        fontSize: size + 'px',
        color: 'black'
    });
    elem.innerText = text;
    return elem;
}

function cost_to_style(cost) {
    // console.log(cost);
    if (cost[0] == '{')
        cost = cost.substr(1, cost.length - 2);
    const res = cost.replace('/', '').toLowerCase();
    // console.log(res);
    return res;
}

function calculate_manacost(card) {
    let manacost = '';
    const re = /\{[^}]+\}/g
    let m;
    do {
        m = re.exec(card.cost);
        if (m) {
            const x = m[0];
            const cost = cost_to_style(x);
            manacost += `<i class="ms ms-${cost} ms-cost card-cost"></i>`;
        }
    } while (m);
    return manacost;
}

/**
 * [wubrg] -> monocolor
 * a -> artefact / colorless
 * xy -> twocolor
 * ~xy -> mixcolor
 * gold -> gold
 */
function determine_card_color(card) {
    const cost = card.cost.toLowerCase();
    let colors = '';
    if (cost.includes('w')) colors += 'w';
    if (cost.includes('u')) colors += 'u';
    if (cost.includes('r')) colors += 'r';
    if (cost.includes('b')) colors += 'b';
    if (cost.includes('g')) colors += 'g';
    if (colors.length == 0) {
        return 'a';
    }
    if (colors.length == 1) {
        return colors;
    }
    if (colors.length == 2 && /\{[wubrg]\/[wubrg]\}/.test(cost)) {
        return '~' + to_order(colors);
    }
    if (colors.length == 2) {
        return to_order(colors);
    }
    return 'gold';
}

function lpad(p, s, length) {
    if (s.length >= length) return s;
    return ('\x01'.repeat(length) + s).slice(-length).replace(/\x01/g, p);
}

function render_card(card) {
    console.log(card);
    const root = document.getElementById('card');
    while (root.lastElementChild) {
        root.removeChild(root.lastElementChild);
    }

    root.style.position = "relative";
    root.style.width = '822px';
    root.style.height = '1122px';
    root.style.transform = 'scale(0.5) translateX(-411px) translateY(-561px)';

    const is_legendary = /Legendary/.test(card.supertype);
    const is_land = /Land/.test(card.type);
    const is_artifact = /Artifact/.test(card.type);

    /**
     * @type {string}
     */
    const card_color = card.color || determine_card_color(card);
    const determined_card_color = card_color.startsWith('~') ? card_color.substring(1) : card_color;
    const is_mixcolored = card_color[0] == '~';

    //? all lands use the same background
    const background_color = card.bg_color || (
        is_land ? 'l' :
        is_artifact ? 'a' :
        determined_card_color.length == 1 || is_mixcolored ? determined_card_color :
        'gold');
    //? mixcolred cards use "land" textboxes -- check [[Djinn Illuminatus]]
    const textbox_color = card.textbox_color || (
        is_mixcolored ? 'l' :
        determined_card_color.length == 1 ? determined_card_color :
        'gold');
    const frame_color = card.frame_color || (
        determined_card_color && is_land == 'a' ? 'l' : determined_card_color
    );

    // art frame
    const art_frame = img_elem(card.image,
        card.full_art ? 63 : 92,
        card.full_art ? 64 : 153,
        card.full_art ? 697 : 639,
        card.full_art ? 947 : 466
    );

    Object.assign(art_frame.style, {
        backgroundRepeat: 'no-repeat',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
    });

    root.appendChild(art_frame);

    // background
    const bg_nyx = card.nyx ? 'n' : ''; // or 'n';
    if (!card.full_art) {
        const background = img_elem(`./img/bg${bg_nyx}-${background_color}.png`);
        root.appendChild(background);
    }

    // shadows around elements
    const shadows_legend = is_legendary ? '-l' : '';
    root.appendChild(img_elem(`./img/shadows${shadows_legend}.png`))

    // border
    root.appendChild(img_elem(`./img/border.png`))

    // frames
    const frame_land = is_land ? 'l' : '';
    const frame_elem = img_elem(`./img/pl${frame_land}-${frame_color}.png`);
    root.appendChild(frame_elem);

    if (card.full_art) {
        frame_elem.style.opacity = '0.8';
    } else if (card.nyx) {
        frame_elem.style.opacity = '0.9';
    }

    if (is_legendary) {
        root.appendChild(img_elem(`./img/crown-${frame_color}.png`))
    }

    // textboxes
    root.appendChild(img_elem(`./img/ntb-${textbox_color}.png`));

    if (card.pt) {
        // pt box
        root.appendChild(img_elem(`./img/pt-${textbox_color}.png`));
    }

    // --------------- TEXTBOXES ---------------

    // card name
    const card_name_elem = text_elem(card.name, 100, 90, 'Beleren', 40);
    root.appendChild(card_name_elem);


    // typeline
    let typeline_text = card.type;
    if (card.supertype) {
        typeline_text = card.supertype + ' ' + typeline_text;
    }
    if (card.subtype) {
        typeline_text += ' — ' + card.subtype;
    }
    const typeline_elem = text_elem(typeline_text, 99, 634, 'Beleren', 35)
    root.appendChild(typeline_elem);
    fit_elem_to_width(typeline_elem, 570);

    // cc shadow
    const manacost_shadow_elem = document.createElement('div');
    Object.assign(manacost_shadow_elem.style, {
        position: 'absolute',
        top: '96px',
        right: '91px',
        padding: '0',
        margin: '0',
        width: 'auto',
        fontSize: '27px',
        textAlign: 'right'
    });
    manacost_shadow_elem.classList.add('cc-shadow');
    manacost_shadow_elem.innerHTML = calculate_manacost(card);
    root.appendChild(manacost_shadow_elem);

    // cc
    const manacost_elem = document.createElement('div');
    Object.assign(manacost_elem.style, {
        position: 'absolute',
        top: '93px',
        right: '89px',
        padding: '0',
        margin: '0',
        width: 'auto',
        fontSize: '27px',
        textAlign: 'right'
    });
    manacost_elem.innerHTML = calculate_manacost(card);
    root.appendChild(manacost_elem);

    fit_elem_to_width(card_name_elem, 629 - manacost_elem.offsetWidth);

    let card_text = card.text
        .replace(/</g, '&lt;')
        .replace(/\>/g, '&gt;')
        .replace(/  \n/g, '<br>')
        .replace(/\n/g, '<p>')
        .replace(/(?<!\w)-(?!\w)/g, '–') // en dash
        .replace(/--/g, '—') // em dash
        .replace(/\{([^}]+)\}/g, (s, cost) => `<i class="ms ms-${cost_to_style(cost)} ms-cost ms-inline"></i>`)
        .replace(/\([^)]+\)/g, s => `<i>${s}</i>`)
        .replace(/~/g, card.name);

    if (card_text && card.flavor_text) {
        card_text += '<hr>';
    }
    if (card.flavor_text) {
        card_text += '<i>' + card.flavor_text + '</i>';
    }

    const text_element = text_elem('', 99, 703, 'MPlantin', 37);
    const inenr_elem = document.createElement('span');
    inenr_elem.classList.add('text-deco')
    inenr_elem.innerHTML = card_text;
    Object.assign(text_element.style, {
        height: '290px',
        width: '624px',
        display: 'flex',
        alignItems: 'center'
    });
    let font_size = 37;
    text_element.appendChild(inenr_elem);
    root.appendChild(text_element);

    while (font_size > 8 && inenr_elem.offsetHeight > text_element.offsetHeight) {
        font_size--;
        text_element.style.fontSize = font_size + 'px';
    }

    // power / toughness
    if (card.pt) {
        const pt_elem = text_elem(card.pt, 634, 974, 'Beleren', 40);
        Object.assign(pt_elem.style, {
            height: '40px',
            minWidth: '100px',
            textAlign: 'center'
        });
        root.appendChild(pt_elem);

        fit_elem_to_width(pt_elem, 100);
    }

    // --------------- bottom text ---------------

    const COLLECTOR_FONT_SIZE = 15;
    const LEGAL_FONT_SIZE = 14;

    // card numbers
    const card_number_padded = lpad('0', card.card_number, 3);
    const set_total_padded = lpad('0', card.set_total, 3);
    const card_number = text_elem(`${card_number_padded} / ${set_total_padded}`, 84, 1015, 'Gotham, "Trueno-Light"', COLLECTOR_FONT_SIZE);
    card_number.style.letterSpacing = '0.1em';
    card_number.style.color = 'white';
    root.appendChild(card_number);
    fit_elem_to_width(card_number, 80);

    // rarity
    const rarity_text = text_elem(card.rarity, 175, 1015, 'Gotham, "Trueno-Light"', COLLECTOR_FONT_SIZE);
    rarity_text.style.letterSpacing = '0.1em';
    rarity_text.style.color = 'white';
    root.appendChild(rarity_text);

    // set name - lang
    const set_name_lang = text_elem('', 84, 1033, 'Gotham, "Trueno-Light"', COLLECTOR_FONT_SIZE);
    set_name_lang.innerHTML = `${lpad('&nbsp;', card.set_name, 3)} • ${lpad('&nbsp;', card.card_lang, 2)}`;
    set_name_lang.style.letterSpacing = '0.1em';
    set_name_lang.style.color = 'white';
    root.appendChild(set_name_lang);
    fit_elem_to_width(set_name_lang, 80);

    // artist name
    const artist_name = text_elem('', 175, 1033, 'Beleren', COLLECTOR_FONT_SIZE);
    artist_name.innerHTML = `<i class="ms ms-artist-nib"></i>&nbsp;&nbsp;${card.artist_name}`;
    artist_name.style.color = 'white';
    artist_name.style.fontVariant = 'small-caps';
    root.appendChild(artist_name);

    // legal stuff
    const legal_text = text_elem(card.card_legal, '', card.pt ? 1034 : 1018, 'MPlantin', LEGAL_FONT_SIZE);
    legal_text.style.left = '';
    legal_text.style.right = '85px';
    legal_text.style.color = 'white';
    root.appendChild(legal_text);
}

const FILE_ELEMENTS = {}

function default_card(id) {
    return {
        id: id,
        name: '',
        cost: '',
        supertype: '',
        type: 'Creature',
        subtype: '',
        text: '',
        flavor_text: '',

        image: '',
        full_art: false,

        pt: '',
        color: '',
        bg_color: '',
        frame_color: '',
        textbox_color: '',
        card_number: '1',
        set_total: '1',
        rarity: 'C',
        set_name: 'SET',
        card_lang: 'EN',
        artist_name: '',
        card_legal: '',

        nyx: false
    }
}

function load_from_fields() {
    const supertypes = [];
    if (document.getElementById('input-basic').checked) supertypes.push('Basic');
    if (document.getElementById('input-legendary').checked) supertypes.push('Legendary');
    if (document.getElementById('input-tribal').checked) supertypes.push('Tribal');
    if (document.getElementById('input-snow').checked) supertypes.push('Snow');
    if (document.getElementById('input-world').checked) supertypes.push('World');

    const color = document.getElementById('input-color').value
    const mixcolor = color.length == 2 && document.getElementById('input-mixcolored').checked ? '~' : ''

    const card = {
        id: document.getElementById('input-id').value,
        name: document.getElementById('input-name').value,
        cost: document.getElementById('input-cost').value,
        supertype: supertypes.join(' '),
        type: document.getElementById('input-type').value,
        subtype: document.getElementById('input-subtype').value,
        text: document.getElementById('input-text').value,
        flavor_text: document.getElementById('input-flavor').value,

        image: FILE_ELEMENTS['input-image'] || '',
        full_art: document.getElementById('input-full-art').checked,

        pt: document.getElementById('input-pt').value,
        color: mixcolor + color,
        bg_color: document.getElementById('input-background-color').value,
        frame_color: document.getElementById('input-frame-color').value,
        textbox_color: document.getElementById('input-textbox-color').value,
        card_number: document.getElementById('input-card-number').value,
        set_total: document.getElementById('input-set-total').value,
        rarity: document.getElementById('input-card-rarity').value,
        set_name: document.getElementById('input-set-name').value,
        card_lang: document.getElementById('input-card-lang').value,
        artist_name: document.getElementById('input-artist-name').value,
        card_legal: '',

        nyx: document.getElementById('input-nyx').checked
        // card_legal: document.getElementById('input-card-legal').value,
    };
    // console.log(card.color)
    return card;
}

function load_to_fields(card) {
    document.getElementById('input-basic').checked = /Basic/.test(card.supertype);
    document.getElementById('input-legendary').checked = /Legendary/.test(card.supertype);
    document.getElementById('input-tribal').checked = /Tribal/.test(card.supertype);
    document.getElementById('input-snow').checked = /Snow/.test(card.supertype);
    document.getElementById('input-world').checked = /World/.test(card.supertype);

    document.getElementById('input-id').value = card.id;
    document.getElementById('input-name').value = card.name;
    document.getElementById('input-cost').value = card.cost;
    document.getElementById('input-type').value = card.type;
    document.getElementById('input-subtype').value = card.subtype;
    document.getElementById('input-text').value = card.text;
    document.getElementById('input-flavor').value = card.flavor_text;

    FILE_ELEMENTS['input-image'] = card.image;
    document.getElementById('input-full-art').checked = card.full_art;

    document.getElementById('input-pt').value = card.pt;

    document.getElementById('input-mixcolored').checked = card.color[0] == '~';
    document.getElementById('input-color').value = card.color[0] == '~' ? card.color.substr(1) : card.color;
    document.getElementById('input-background-color').value = card.bg_color;
    document.getElementById('input-frame-color').value = card.frame_color;
    document.getElementById('input-textbox-color').value = card.textbox_color;
    document.getElementById('input-card-number').value = card.card_number;
    document.getElementById('input-set-total').value = card.set_total;
    document.getElementById('input-card-rarity').value = card.rarity;
    document.getElementById('input-set-name').value = card.set_name;
    document.getElementById('input-card-lang').value = card.card_lang;
    document.getElementById('input-artist-name').value = card.artist_name;
    document.getElementById('input-nyx').checke = card.nyx;
}

function update_card() {
    let card = load_from_fields();
    render_card(card);
    save_card();
}

function initial_load() {
    let all_cards = load_all_cards();
    if (all_cards.length == 0) {
        create_card();
    } else {
        load_to_fields(all_cards[0]);
        update_card();
    }
}

initial_load();

function load_file() {
    const file_input = document.getElementById('input-image');
    const files = file_input.files;
    if (files.length == 0) {
        FILE_ELEMENTS['input-image'] = '';
        update_card();
    } else {
        const reader = new FileReader();
        reader.onload = () => {
            FILE_ELEMENTS['input-image'] = reader.result;
            update_card();
        };
        reader.onerror = (e) => {
            console.error(e);
        };
        reader.readAsDataURL(files[0]);
    }

}

function download_card(bleed, download) {
    const card = load_from_fields();
    render_card(card);
    const elem = document.getElementById("card-container");
    window.scrollTo(0, 0);
    // setTimeout(() => {
    html2canvas(elem, {
        windowWidth: 100000,
        windowHeight: 100000,
        width: 822 - (bleed ? 0 : 2 * 31),
        height: 1122 - (bleed ? 0 : 2 * 34),
        x: 0 + (bleed ? 0 : 31),
        y: 0 + (bleed ? 0 : 34),
        onclone: (doc) => {
            // [...doc.getElementsByTagName('table')].forEach(x => x.remove());
            // const iframe = document.getElementsByClassName('html2canvas-container')[0];
            // iframe.width = 100000;
            // iframe.height = 100000;
            const cc = doc.getElementById('card-container');
            cc.style.position = 'fixed';
            cc.style.left = '0';
            cc.style.top = '0';
            cc.style.right = '0';
            const c = doc.getElementById('card');
            c.style.transform = '';
        }
    }).then(canvas => {
        if (download) {
            canvas.toBlob(data => saveAs(data, card.name.replace(/\W+/g, '-').toLowerCase() + '.png'));
        } else {
            const url = canvas.toDataURL();
            window.open(url, '_blank');
        }
        render_card(card);
    }).catch((e) => {
        console.error(e);
        render_card(card);
    });
    // }, 0);
}

function save_card() {
    const card = load_from_fields();
    localStorage.setItem('card-' + card.id, JSON.stringify(card));
    render_table();
}

function load_card_from_storage(card_id) {
    return JSON.parse(localStorage.getItem('card-' + card_id));
}

function current_card_id() {
    return document.getElementById('input-id').value;
}

function load_all_cards() {
    const c = [];
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (!key.startsWith('card-')) continue;
        c.push(JSON.parse(localStorage.getItem(key)));
    }
    return c;
}

function render_table() {
    const cards = load_all_cards();
    const cardlist = document.getElementById('cardlist');
    
    while(cardlist.lastElementChild) {
        cardlist.removeChild(cardlist.lastElementChild);
    }
    
    cardlist.appendChild(document.createElement('tr')).innerHTML = `
        <th>#</th>
        <th>Name</th>
    `;
    
    const current_card = current_card_id();
    
    cards.forEach((card, i) => {
        const elem = document.createElement('tr');
        if (current_card == card.id) {
            elem.classList.add('current-card');
        }
        elem.innerHTML = `
            <td>${i + 1}</td>
            <td>${card.name}</td>
        `;
        cardlist.appendChild(elem);
        elem.onclick = () => {
            load_to_fields(load_card_from_storage(card.id));
            update_card();
        }
    })
}

function create_card() {
    const id = Date.now().toString();
    load_to_fields(default_card(id));
    update_card();
}

function delete_card() {
    const id = current_card_id();
    if (confirm('Are you sure you want to delete "' + document.getElementById('input-name').value + '"?')) {
        localStorage.removeItem('card-' + id);
        initial_load();
    }
}

render_table();