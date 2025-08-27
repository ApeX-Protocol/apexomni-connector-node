import {ApexWsClient} from "../src";
import {WS_QA} from "../src/omni";
import {ApiKeyCredentials} from "../src/omni/interface";
import {omniUser} from "../src/mock";


(async () => {
  const apiKeyCredentials: ApiKeyCredentials = {
    key: omniUser.key,
    passphrase: omniUser.passphrase,
    secret: omniUser.secret,
  };
  const client = new ApexWsClient(WS_QA, apiKeyCredentials );
  client.subscribePrivateData((data) => {
    console.log('PrivateData:', data);
  });
})();
