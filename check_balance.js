const fs = require("fs");
const request = require('sync-request');
function getBalance(addr) {
  try {
    let url = `https://blockstream.info/api/address/${addr}`;
    var res = request('GET', url);
    var bd = res.getBody('utf8');
    var bd_s = JSON.parse(bd);
    var funded_txo_sum = bd_s.chain_stats.funded_txo_sum;
    var spent_txo_sum = bd_s.chain_stats.spent_txo_sum;
    return [parseInt(funded_txo_sum) - parseInt(spent_txo_sum), funded_txo_sum, spent_txo_sum];
  } catch (error) {
	  console.log("Error get balance");
  }
}
async function getBitcoinBalance(address) {
    const url = `https://btc1.trezor.io/address/${address}`;

    try {
        const response = await axios.get(url);
        const html = response.data;

        // Extract balance using a regex pattern (Trezor API returns HTML)
        const match = html.match(/<span id="final_balance">([\d,]+) BTC<\/span>/);

        if (match && match[1]) {
            return match[1];
        } else {
            return 0;
        }

    } catch (error) {
        return 0;
    }
}


function main() {
	const TARGET_ADDRESSES_FILE = "./keymaker/target_addresses.json";
	const data = fs.readFileSync(TARGET_ADDRESSES_FILE, "utf8");
	const targetAddresses = new Set(JSON.parse(data));
	const addressArray = [...targetAddresses];

        // Iterate and print each address
    addressArray.forEach(address => {
		let balance = getBalance(address);
		if(balance[0] > 0 && balance[2]==0) {
			fs.appendFileSync("nspent.txt", "'" + address + "',\n");
			console.log("UNSPENT : " + address , balance);
		} else {
			console.log("NOT SAVED : " + address , balance);
		}

    });

}
main();