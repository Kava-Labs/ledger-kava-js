import KavaApp from "index.js";
import TransportNodeHid from "@ledgerhq/hw-transport-node-hid";
import { expect, test } from "jest";
import secp256k1 from "secp256k1/elliptic";
import crypto from "crypto";
import { ERROR_CODE } from "../src/common";

test("get version", async () => {
  const transport = await TransportNodeHid.create(1000);

  const app = new KavaApp(transport);
  const resp = await app.getVersion();
  console.log(resp);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");
  expect(resp).toHaveProperty("test_mode");
  expect(resp).toHaveProperty("major");
  expect(resp).toHaveProperty("minor");
  expect(resp).toHaveProperty("patch");
  expect(resp.test_mode).toEqual(false);
});

test("publicKey", async () => {
  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 0, 0, 0];

  const resp = await app.publicKey(path);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");
  expect(resp).toHaveProperty("compressed_pk");
  expect(resp.compressed_pk.length).toEqual(33);
  expect(resp.compressed_pk.toString("hex")).toEqual(
    "034fef9cd7c4c63588d3b03feb5281b9d232cba34d6f3d71aee59211ffbfe1fe87",
  );
});

test("getAddressAndPubKey", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 5, 0, 3];
  const resp = await app.getAddressAndPubKey(path, "kava");

  console.log(resp);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");

  expect(resp).toHaveProperty("bech32_address");
  expect(resp).toHaveProperty("compressed_pk");

  expect(resp.bech32_address).toEqual("kava1wkd9tfm5pqvhhaxq77wv9tvjcsazuaykwsld65");
  expect(resp.compressed_pk.length).toEqual(33);
});

test("showAddressAndPubKey", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 5, 0, 3];
  const resp = await app.showAddressAndPubKey(path, "kava");

  console.log(resp);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");

  expect(resp).toHaveProperty("bech32_address");
  expect(resp).toHaveProperty("compressed_pk");

  expect(resp.bech32_address).toEqual("kava1wkd9tfm5pqvhhaxq77wv9tvjcsazuaykwsld65");
  expect(resp.compressed_pk.length).toEqual(33);
});

test("appInfo", async () => {
  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  const resp = await app.appInfo();

  console.log(resp);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");

  expect(resp).toHaveProperty("appName");
  expect(resp).toHaveProperty("appVersion");
  expect(resp).toHaveProperty("flagLen");
  expect(resp).toHaveProperty("flagsValue");
  expect(resp).toHaveProperty("flag_recovery");
  expect(resp).toHaveProperty("flag_signed_mcu_code");
  expect(resp).toHaveProperty("flag_onboarded");
  expect(resp).toHaveProperty("flag_pin_validated");
});

test("deviceInfo", async () => {
  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  const resp = await app.deviceInfo();

  console.log(resp);

  expect(resp.return_code).toEqual(ERROR_CODE.NoError);
  expect(resp.error_message).toEqual("No errors");

  expect(resp).toHaveProperty("targetId");
  expect(resp).toHaveProperty("seVersion");
  expect(resp).toHaveProperty("flag");
  expect(resp).toHaveProperty("mcuVersion");
});

test("sign_and_verify", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 0, 0, 0];
  const message = String.raw`{"account_number":"6571","chain_id":"cosmoshub-2","fee":{"amount":[{"amount":"5000","denom":"ukava"}],"gas":"200000"},"memo":"Delegated with Ledger from union.market","msgs":[{"type":"cosmos-sdk/MsgDelegate","value":{"amount":{"amount":"1000000","denom":"ukava"},"delegator_address":"kava102hty0jv2s29lyc4u0tv97z9v298e24t3vwtpl","validator_address":"kavavaloperoper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}}],"sequence":"0"}`;

  const responsePk = await app.publicKey(path);
  console.log(responsePk);
  expect(responsePk.return_code).toEqual(ERROR_CODE.NoError);
  expect(responsePk.error_message).toEqual("No errors");

  const responseSign = await app.sign(path, message);
  console.log(responseSign);
  expect(responseSign.return_code).toEqual(ERROR_CODE.NoError);
  expect(responseSign.error_message).toEqual("No errors");

  // Check signature is valid
  const hash = crypto.createHash("sha256");
  const msgHash = hash.update(message).digest();

  const signatureDER = responseSign.signature;
  const signature = secp256k1.signatureImport(signatureDER);
  const signatureOk = secp256k1.verify(msgHash, signature, responsePk.compressed_pk);
  expect(signatureOk).toEqual(true);
});

test("sign_tiny_memo", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 0, 0, 0];
  const message = String.raw`{"account_number":"0","chain_id":"test-chain-1","fee":{"amount":[{"amount":"5","denom":"photon"}],"gas":"10000"},"memo":"A","msgs":[{"inputs":[{"address":"cosmosaccaddr1d9h8qat5e4ehc5","coins":[{"amount":"10","denom":"atom"}]}],"outputs":[{"address":"cosmosaccaddr1da6hgur4wse3jx32","coins":[{"amount":"10","denom":"atom"}]}]}],"sequence":"1"}`;

  const responsePk = await app.publicKey(path);
  const responseSign = await app.sign(path, message);

  console.log(responsePk);
  console.log(responseSign);

  expect(responsePk.return_code).toEqual(ERROR_CODE.NoError);
  expect(responsePk.error_message).toEqual("No errors");
  expect(responseSign.return_code).toEqual(ERROR_CODE.NoError);
  expect(responseSign.error_message).toEqual("No errors");

  // Check signature is valid
  const hash = crypto.createHash("sha256");
  const msgHash = hash.update(message).digest();

  const signatureDER = responseSign.signature;
  const signature = secp256k1.signatureImport(signatureDER);
  const signatureOk = secp256k1.verify(msgHash, signature, responsePk.compressed_pk);
  expect(signatureOk).toEqual(true);
});

test("sign_empty_memo", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 0, 0, 0];
  const message = String.raw`{"account_number":"0","chain_id":"test-chain-1","fee":{"amount":[{"amount":"5","denom":"photon"}],"gas":"10000"},"memo":"","msgs":[{"inputs":[{"address":"cosmosaccaddr1d9h8qat5e4ehc5","coins":[{"amount":"10","denom":"atom"}]}],"outputs":[{"address":"cosmosaccaddr1da6hgur4wse3jx32","coins":[{"amount":"10","denom":"atom"}]}]}],"sequence":"1"}`;

  const responsePk = await app.publicKey(path);
  const responseSign = await app.sign(path, message);

  console.log(responsePk);
  console.log(responseSign);

  expect(responsePk.return_code).toEqual(ERROR_CODE.NoError);
  expect(responsePk.error_message).toEqual("No errors");
  expect(responseSign.return_code).toEqual(ERROR_CODE.NoError);
  expect(responseSign.error_message).toEqual("No errors");

  // Check signature is valid
  const hash = crypto.createHash("sha256");
  const msgHash = hash.update(message).digest();

  const signatureDER = responseSign.signature;
  const signature = secp256k1.signatureImport(signatureDER);
  const signatureOk = secp256k1.verify(msgHash, signature, responsePk.compressed_pk);
  expect(signatureOk).toEqual(true);
});

test("sign_withdraw", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  // Derivation path. First 3 items are automatically hardened!
  const path = [44, 459, 0, 0, 0];

  const tx_str = {
    account_number: "108",
    chain_id: "cosmoshub-2",
    fee: {
      amount: [
        {
          amount: "600",
          denom: "ukava",
        },
      ],
      gas: "200000",
    },
    memo: "",
    msgs: [
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "kava1kky4yzth6gdrm8ga5zlfwhav33yr7hl87jycah",
          validator_address: "kavavaloperoper1kn3wugetjuy4zetlq6wadchfhvu3x740ae6z6x",
        },
      },
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "kava1kky4yzth6gdrm8ga5zlfwhav33yr7hl87jycah",
          validator_address: "kavavaloperoper1sjllsnramtg3ewxqwwrwjxfgc4n4ef9u2lcnj0",
        },
      },
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "kava1kky4yzth6gdrm8ga5zlfwhav33yr7hl87jycah",
          validator_address: "kavavaloperoper1ey69r37gfxvxg62sh4r0ktpuc46pzjrm873ae8",
        },
      },
      {
        type: "cosmos-sdk/MsgWithdrawDelegationReward",
        value: {
          delegator_address: "kava1kky4yzth6gdrm8ga5zlfwhav33yr7hl87jycah",
          validator_address: "kavavaloperoper1648ynlpdw7fqa2axt0w2yp3fk542junl7rsvq6",
        },
      },
    ],
    sequence: "106",
  };

  const message = JSON.stringify(tx_str);

  const responsePk = await app.publicKey(path);
  const responseSign = await app.sign(path, message);

  console.log(responsePk);
  console.log(responseSign);

  expect(responsePk.return_code).toEqual(ERROR_CODE.NoError);
  expect(responsePk.error_message).toEqual("No errors");
  expect(responseSign.return_code).toEqual(ERROR_CODE.NoError);
  expect(responseSign.error_message).toEqual("No errors");

  // Check signature is valid
  const hash = crypto.createHash("sha256");
  const msgHash = hash.update(message).digest();

  const signatureDER = responseSign.signature;
  const signature = secp256k1.signatureImport(signatureDER);
  const signatureOk = secp256k1.verify(msgHash, signature, responsePk.compressed_pk);
  expect(signatureOk).toEqual(true);
});

test("sign_big_tx", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  const path = [44, 459, 0, 0, 0]; // Derivation path. First 3 items are automatically hardened!
  const message =
    '{"account_number":"108","chain_id":"cosmoshub-2",' +
    '"fee":{"amount":[{"amount":"600","denom":"ukava"}],"gas":"200000"},"memo":"",' +
    '"msgs":[{"type":"cosmos-sdk/MsgWithdrawDelegationReward","value":' +
    '{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1qwl879nx9t6kef4supyazayf7vjhennyh568ys"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1x88j7vp2xnw3zec8ur3g4waxycyz7m0mahdv3p"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1grgelyng2v6v3t8z87wu3sxgt9m5s03xfytvz7"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1ttfytaf43nkytzp8hkfjfgjc693ky4t3y2n2ku"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1wdrypwex63geqswmcy5qynv4w3z3dyef2qmyna"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper102ruvpv2srmunfffxavttxnhezln6fnc54at8c"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper10e4vsut6suau8tk9m6dnrm0slgd6npe3jx5xpv"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1sxx9mszve0gaedz5ld7qdkjkfv8z992ax69k08"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1ssm0d433seakyak8kcf93yefhknjleeds4y3em"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper13sduv92y3xdhy3rpmhakrc3v7t37e7ps9l0kpv"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper15urq2dtp9qce4fyc85m6upwm9xul3049e02707"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper14kn0kk33szpwus9nh8n87fjel8djx0y070ymmj"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper14lultfckehtszvzw4ehu0apvsr77afvyju5zzy"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1k9a0cs97vul8w2vwknlfmpez6prv8klv03lv3d"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1kj0h4kn4z5xvedu2nd9c4a9a559wvpuvu0h6qn"}},{"type":"cosmos-sdk/MsgWithdrawDelegationReward",' +
    '"value":{"delegator_address":"kava14lultfckehtszvzw4ehu0apvsr77afvyhgqhwh","validator_address":' +
    '"kavavaloperoper1hjct6q7npsspsg3dgvzk3sdf89spmlpfdn6m9d"}}],"sequence":"106"}';

  const responsePk = await app.publicKey(path);
  const responseSign = await app.sign(path, message);

  console.log(responsePk);
  console.log(responseSign);

  expect(responsePk.return_code).toEqual(ERROR_CODE.NoError);
  expect(responsePk.error_message).toEqual("No errors");

  switch (app.versionResponse.major) {
    case 1:
      expect(responseSign.return_code).toEqual(0x6984);
      expect(responseSign.error_message).toEqual("Data is invalid : JSON. Too many tokens");
      break;
    default:
      expect.fail("Version not supported");
  }
});

test("sign_invalid", async () => {
  jest.setTimeout(60000);

  const transport = await TransportNodeHid.create(1000);
  const app = new KavaApp(transport);

  const path = [44, 459, 0, 0, 0]; // Derivation path. First 3 items are automatically hardened!
  const invalidMessage =
    '{"chain_id":"local-testnet","fee":{"amount":[],"gas":"500000"},"memo":"","msgs":[{"delegator_addr":"kava1qpd4xgtqmxyf9ktjh757nkdfnzpnkamny3cpzv","validator_addr":"kavavaloperoper1zyp0axz2t55lxkmgrvg4vpey2rf4ratcsud07t","value":{"amount":"1","denom":"stake"}}],"sequence":"0"}';

  const responseSign = await app.sign(path, invalidMessage);

  console.log(responseSign);

  switch (app.versionResponse.major) {
    case 1:
      expect(responseSign.return_code).toEqual(0x6984);
      expect(responseSign.error_message).toEqual("Data is invalid : JSON Missing account number");
      break;
    default:
      console.log("Version not supported");
      expect(false).toEqual(true);
  }
});
