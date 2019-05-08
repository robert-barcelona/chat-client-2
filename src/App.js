import React, {Component} from 'react';
import gql from 'graphql-tag'
import {Query, Mutation, withApollo} from 'react-apollo';
import './main.scss'

const GET_CONVERSATION_CREDENTIALS = gql`
  query GetConversationCredentials {
    getConversationCredentials {
      sessionToken
      sessionID
    }
  }
`
const GET_CONVERSATIONS = gql`
  query GetConversations($sessionID:String!) {
    getConversations(sessionID:$sessionID) {
      message
      reply
      added
    }
  }
`


const SEND_MESSAGE = gql`
  mutation sendMessage($sessionToken: String!, $sessionID: String!,$message:String!) {
    sendMessage(sessionToken: $sessionToken, sessionID: $sessionID,message:$message) {
      addlData
      conversationFragment {
        reply
      }
    }
  }
`

const GET_SESSION_ID = gql`
  {
    sessionID @client
  }
`


const GET_SESSION_TOKEN = gql`
  {
    sessionToken @client
  }
`

class App extends Component {

  state = {

    message: '',
  }

  messageRef = React.createRef()

  setMessage = e => {
    this.setState({message: e.target.value});
  }

  componentDidMount() {
    const {props: {client}} = this

    const sessionToken = localStorage.getItem('sessionToken')
    const sessionID = localStorage.getItem('sessionID')
    if (sessionToken && sessionID) client.writeData({data: {sessionToken, sessionID}})
  }

  render() {

    let {state: {message, sessionToken, sessionID}} = this

    return (
      <Query query={GET_CONVERSATION_CREDENTIALS}>
        {({data, error, loading, client}) => {

          if (data && data.getConversationCredentials && (!sessionID || !sessionToken)) {
            sessionID = client.readQuery({query: GET_SESSION_ID}).sessionID || data.getConversationCredentials.sessionID
            sessionToken = client.readQuery({query: GET_SESSION_TOKEN}).sessionToken || data.getConversationCredentials.sessionToken
            localStorage.setItem('sessionID', sessionID)
            localStorage.setItem('sessionToken', sessionToken)
            console.log('processing data', data.getConversationCredentials, 'sessionID', sessionID, 'sessionToken', sessionToken)
            if (sessionToken && sessionID) client.writeData({data: {sessionToken, sessionID}})
          }

          if (loading) return 'Loading...'
          if (error) return <div className='message is-warning'>
            <div className="message-header">
              {`Error in GET_CONVERSATION_CREDENTIALS Query: ${error.toString()}`}</div>
          </div>

          return (
            <div className="container main">
              <div className='hero'>
                <div className='hero-body has-background-warning'>Chatomatic 2000</div>
              </div>
              <div className='columns'>
                <div className='column is-two-thirds'>

                  <Mutation mutation={SEND_MESSAGE} refetchQueries={() => [{
                    query: GET_CONVERSATIONS,
                    variables: {sessionID}
                  }]}>
                    {(sendMessage, {data, error, loading, client}) => {
                      console.log('mutation data', data)
                      return (<div className='columns'>
                        <div className='column is-half'>
                          {error && <div className='message is-warning'>
                            <div className="message-header">
                              {`Error in SEND_MESSAGE Mutation: ${error.toString()}`}</div>
                          </div>}
                          <form
                            onSubmit={
                              async e => {
                                e.preventDefault()
                                try {
                                  if (message) await sendMessage({variables: {sessionToken, sessionID, message}})
                                } catch (error) {
                                  console.log(error.message)
                                }
                                if (this.messageRef.current) this.messageRef.current.value = ''

                              }
                            }>

                            <div className="field">
                              <p className="control has-icons-left has-icons-right">
                                <input ref={this.messageRef} value={message} onChange={this.setMessage}
                                       className="input"
                                       type="text"
                                       placeholder="Message..."/>
                                <span className="icon is-small is-left">
        <i className="fas fa-pencil"></i>
        </span>

                              </p>
                            </div>

                            <div className="field">
                              <p className="control">
                                <button className="button is-success">
                                  Send
                                </button>
                              </p>
                            </div>

                          </form>
                          {loading && <h3>Writing...</h3>}
                        </div>
                        <div className='column is-half'>
                          {data && data.sendMessage && data.sendMessage.conversationFragment &&
                          <div className='reply  has-text-white'><span className='reply-title'>Chatomatic says: </span>{data.sendMessage.conversationFragment.reply}
                          </div>}
                        {data && data.sendMessage &&  <div className='reply  has-text-white'>{ data.sendMessage.addlData.map((data, i) => <div
                            key={i}>{data}</div>)}</div>}
                        </div>
                      </div>)


                    }}

                  </Mutation>
                </div>
                <div className='column is-one-third'>
                  <Query
                    query={GET_CONVERSATIONS}
                    variables={{sessionID}}>
                    {({data, loading, error}) => {

                      if (error) return error.message
                      if (loading) return 'Loading...'
                      return (

                        <div className='list'>
                          {data && data.getConversations && data.getConversations.map((convo, i) =>
                            <div className='list-item history' key={i}><span
                              className=' history-message'><span className='has-text-success history-message-title'>You: </span>{convo.message}</span>
                              <br/><span
                                className='history-reply'><span className='has-text-success history-reply-title'>Chatomatic: </span>{convo.reply}</span>
                              <br/>
                              <span className='history-date'>{convo.added}</span>
                            </div>)}
                        </div>
                      )
                    }}


                  </Query>


                </div>

              </div>
            </div>)
        }

        }

      </Query>


    )
  }
}

export default withApollo(App);
