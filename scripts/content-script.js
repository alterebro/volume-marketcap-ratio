// ------------

function val2HSL(val) {
	function _map(value, start1, stop1, start2, stop2) {
		return ((value - start1) / (stop1 - start1)) * (stop2 - start2) + start2;
	}
	function _clamp(min, max, v) {
		return Math.min(max, Math.max(min, v));
	}

	let hue = _clamp(0, 50, val);
	hue = _map(hue, 0, 50, 0, 120);
	hue = Math.round(hue);

	let sat = _clamp(0, 50, val);
	sat = _map(sat, 0, 50, 50, 75);
	sat = Math.round(sat);

	let lum = _clamp(0, 50, val);
	lum = _map(lum, 0, 50, 40, 50);
	lum = Math.round(lum);

	return val < 0.1
		? `color: hsl(0, 30%, 30%); text-align: center; font-weight: bold;`
		: `color: hsl(${hue}, ${sat}%, ${lum}%);`;
}

function generateTableRows(data) {
	const tbody = document.querySelector("#vol-mcap-ratio table tbody");
	tbody.innerHTML = "";

	data.forEach((item) => {
		let _h24 =
			item.age > 6 && item.ratio_h24 > 0.1 ? item.ratio_h24.toFixed(1) : "-";
		let _h6 =
			item.age > 1 && item.ratio_h6 > 0.1 ? item.ratio_h6.toFixed(1) : "-";
		let _h1 = item.ratio_h1 > 0.1 ? item.ratio_h1.toFixed(1) : "-";
		let _m5 = item.ratio_m5 > 0.1 ? item.ratio_m5.toFixed(1) : "-";

		const row = document.createElement("tr");
		row.innerHTML = `
            <td><strong><a href="https://dexscreener.com/solana/${item.addr}" target="_blank" title="${item.name}">${item.token}</a></strong><small>/${item.quote}</small></td>
            <td data-vol-str="${item.vol.toLocaleString()}">${formatNumber.format(item.vol)}</td>
            <td data-mcap-str="${item.mcap.toLocaleString()}">${formatNumber.format(item.mcap)}</td>
            <td data-age-float="${item.age}">${formatNumber.format(item.age)}</td>
            <td data-ratio-h24="${item.ratio_h24}" style="${val2HSL(item.ratio_h24)}">${_h24}</td>
            <td data-ratio-h6="${item.ratio_h6}" style="${val2HSL(item.ratio_h6)}">${_h6}</td>
            <td data-ratio-h1="${item.ratio_h1}" style="${val2HSL(item.ratio_h1)}">${_h1}</td>
            <td data-ratio-m5="${item.ratio_m5}" style="${val2HSL(item.ratio_m5)}">${_m5}</td>
        `;

		if (item.mcap > 0) {
			tbody.appendChild(row);
		}
	});
}

function sortData(property, sorting) {
	if (sorting == "desc") {
		ratios.sort((a, b) => b[property] - a[property]);
	} else {
		ratios.sort((a, b) => a[property] - b[property]);
	}
	generateTableRows(ratios);
}

// ------------

console.clear();

const formatNumber = Intl.NumberFormat("en-US", {
	notation: "compact",
	maximumFractionDigits: 1,
});

const now = Date.now();
const scripts = document.querySelectorAll("script:not([type]):not([src])");
const server_data = scripts[0];

let script_content = server_data.textContent || server_data.innerHTML;
script_content = script_content
	.replace("window.__SERVER_DATA = ", "")
	.replace(";", "")
	.replace(/undefined/g, "0")
	.replace(/new URL\(\"/g, '"')
	.replace(/new Date\(\"/g, '"')
	.replace(/"\)/g, '"')
	.replace(/;+$/, '')
	.trim();

let parsed_script_content = JSON.parse(script_content);

const pairs = parsed_script_content.route.data.pairs;
const has_pairs = !!pairs && pairs.length;

if ( has_pairs ) {

	let ratios = pairs.map((item) => {
		let _hours = now - item.pairCreatedAt;
		_hours = _hours / (1000 * 60 * 60);

		item.volume.m5 = !!item.volume.m5 ? item.volume.m5 : 0;
		item.volume.h1 = !!item.volume.h1 ? item.volume.h1 : 0;
		item.marketCap = !!item.marketCap ? item.marketCap : 0;

		return {
			token: item.baseToken.symbol,
			name: item.baseToken.name,
			quote: item.quoteToken.symbol,
			addr: item.pairAddress,
			vol: item.volume.h24,
			mcap: item.marketCap,
			age: _hours,
			ratio_h24: _hours > 6 ? item.volume.h24 / item.marketCap : 0,
			ratio_h6: _hours > 1 ? (item.volume.h6 / item.marketCap) * 4 : 0,
			ratio_h1: (item.volume.h1 / item.marketCap) * 24,
			ratio_m5: (item.volume.m5 / item.marketCap) * 288,
		};
	});

	let ratios_div = document.createElement("div");
	ratios_div.setAttribute("id", "vol-mcap-ratio");

	let ratios_button = document.createElement("button");
	ratios_button.setAttribute("id", "vol-mcap-ratio-trigger");
	ratios_button.setAttribute("title", "Volume to MarketCap Ratio");
	ratios_button.append("🔥");
	ratios_button.addEventListener("click", function () {
		const _div = document.querySelector("#vol-mcap-ratio");
		if (_div.classList.contains("hidden")) {
			_div.classList.remove("hidden");
		} else {
			_div.classList.add("hidden");
		}
	});

	let ratios_table = document.createElement("table");
	let ratios_table_caption = document.createElement("caption");
	ratios_table_caption.append("Volume to MarketCap Ratio");
	let ratios_table_head = document.createElement("thead");
	ratios_table_head.innerHTML = `<tr>
			<th>Token Pair</th>
			<th data-sort="vol">Vol</th>
			<th data-sort="mcap">MCap</th>
			<th data-sort="age">Age(h)</th>
			<th data-sort="ratio_h24"><strong>24h</strong></th>
			<th data-sort="ratio_h6"><strong>6h</strong></th>
			<th data-sort="ratio_h1"><strong>1h</strong></th>
			<th data-sort="ratio_m5"><strong>5m</strong></th>
		</tr>`;
	let ratios_table_body = document.createElement("tbody");

	ratios_table.appendChild(ratios_table_caption);
	ratios_table.appendChild(ratios_table_head);
	ratios_table.appendChild(ratios_table_body);

	ratios_div.appendChild(ratios_table);
	document.body.appendChild(ratios_div);
	document.body.appendChild(ratios_button);

	document
	.querySelectorAll("#vol-mcap-ratio table th[data-sort]")
	.forEach((header) => {
		header.addEventListener("click", function () {
			const property = this.getAttribute("data-sort");
			const currentSort = this.classList.contains("sort-desc") ? "desc" : "asc";
			const newSort = currentSort === "desc" ? "asc" : "desc";

			document
				.querySelectorAll("#vol-mcap-ratio table th")
				.forEach((th) => th.classList.remove("sort-asc", "sort-desc"));

			this.classList.add(`sort-${newSort}`);
			sortData(property, newSort);
		});
	});

	generateTableRows(ratios);

}


const pair = parsed_script_content.route.data.pair;
const pairDetails = parsed_script_content.route.data.pairDetails;
const is_pair = !!pair && !!pairDetails;

if ( is_pair ) {

	let mcap = pair.pair.marketCap;
	let holders = pairDetails.holders.count; 
	let ratio = (mcap / holders);

	let keyCommands = [
		' • Market Cap : ' + mcap,
		' • Holders : ' + holders,
	];
	console.log(
		'\n' +
		'%cMarketCap to Holders Ratio' +
		'%c\n' + keyCommands.join("\n") +
		'%c\nRatio: ' + ratio +
		'%c\n@alterebro - https://x.com/alterebro' +
		'\n',

		'color: #fff; background-color: #444; padding: 5px 10px; margin: 10px 0 5px; border-radius: 3px;',
		'line-height: 1.5; font-family: monospace; color: #217eaa',
		'font-weight: bold; margin: 5px; display: block;',
		'margin: 5px; display: block; font-size: 90%; color: #777'
	);

}
