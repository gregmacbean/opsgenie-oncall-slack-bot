const axios = require('axios');

const headers = {
  headers: { Authorization: `GenieKey ${process.env.GENIE_KEY}` },
};

const isJsonString = (value) => {
  try {
    JSON.parse(value);
  } catch (e) {
    return false;
  }
  return true;
};

module.exports.whoisoncall = async (event) => {
  console.log(event);

  // respond to challenge request
  if (
    event.body !== null &&
    event.body !== undefined &&
    isJsonString(event.body)
  ) {
    let body = JSON.parse(event.body);

    if (body.challenge) {
      return {
        statusCode: 200,
        body: JSON.stringify({ challange: body.challenge }, null, 2),
      };
    }
  }

  // get oncall data
  const schedules = await axios.get(
    `https://api.opsgenie.com/v2/schedules`,
    headers
  );

  const scheduleIds = schedules.data.data.map((schedule) => schedule.id);

  const onCalls = await axios.all(
    scheduleIds.map((id) =>
      axios.get(
        `https://api.opsgenie.com/v2/schedules/${id}/on-calls?flat=true`,
        headers
      )
    )
  );

  // produce response
  const oncall = onCalls.map((element) => {
    const {
      _parent: { name: platform },
      onCallRecipients,
    } = element.data.data;

    return `${onCallRecipients.join(' & ')} ${
      onCallRecipients.length > 1 ? 'are' : 'is'
    } on call for ${platform}`;
  });

  return {
    statusCode: 200,
    body: oncall.join('\r\n'),
  };
};
