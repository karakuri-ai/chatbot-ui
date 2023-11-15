import { NextApiRequest, NextApiResponse } from 'next';

const maskingApi = process.env.MASKING_API;
const maskingApiKey = process.env.MASKING_API_KEY;
async function containPersonalInfo(text: string) {
  if (!text || !maskingApi) {
    return false;
  }
  try {
    const data = await fetch(maskingApi, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${maskingApiKey}`,
      },
      body: JSON.stringify({
        text,
      }),
    }).then((res) => res.json());
    return (
      data.message === 'success' && data.result.text !== data.result.raw_text
    );
  } catch (e) {
    console.error(e);
  }
}

const handler = async (req: NextApiRequest, res: NextApiResponse<any>) => {
  try {
    const text = req.body.text || '';
    const result = await containPersonalInfo(text);
    res.status(200).json({ result });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      result: false,
      error: error instanceof Error ? error.message : undefined,
    });
  }
};

export default handler;
