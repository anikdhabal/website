import type { Handler } from '@netlify/functions'
import { createCustomer } from './../services/stripe'
import { useSupabase } from './../services/supabase'
import { findEnv, getRightKey, sendRes, transformEnvVar } from './../services/utils'
import type { definitions } from '~/types/supabase'
const { API_SECRET } = process.env

export const handler: Handler = async(event) => {
  // eslint-disable-next-line no-console
  console.log(event.httpMethod)
  const { authorization } = event.headers
  if (!authorization || !API_SECRET || authorization !== API_SECRET) {
    console.error('Fail Authorizatio')
    return sendRes({ message: 'Fail Authorization' }, 400)
  }
  if (!event.body || !process.env.STRIPE_SECRET_KEY) {
    console.error('Stripe create customer: No body found or no secret found')
    return sendRes('Stripe create customer: No body found or no secret found', 400)
  }

  try {
    const supabase = useSupabase(getRightKey(findEnv(event.rawUrl), 'supa_url'), transformEnvVar(findEnv(event.rawUrl), 'SUPABASE_ADMIN_KEY'))
    const body = JSON.parse(event.body || '{}')
    const record = body.record as definitions['users']
    if (record.customer_id)
      return sendRes()
    const customer = await createCustomer(transformEnvVar(findEnv(event.rawUrl), 'STRIPE_SECRET_KEY'), record.email)
    const { error: dbStripeError } = await supabase
      .from<definitions['stripe_info']>('stripe_info')
      .insert({
        customer_id: customer.id,
      })
    const { error: dbError } = await supabase
      .from<definitions['users']>('users')
      .update({
        customer_id: customer.id,
      })
      .eq('email', record.email)
    if (dbError || dbStripeError) {
      console.error(dbError)
      return sendRes({ message: dbError }, 400)
    }
    return sendRes()
  }
  catch (e) {
    console.error(e)
    return sendRes({ status: 'Cannot create stripe portal', error: e }, 500)
  }
}
