const AWS = require('aws-sdk');

function getSettings(questions) {
    let formType = questions['settings-form-type'];
    formType = formType && decodeURIComponent(formType);
    formType = formType || 'quote'
    
    if (formType === 'service') {
        return {
            Subject: 'Service Request Submission', 
            TopicArn: 'REDACTED', 
            location: 'https://contfire.com/pages/service-request-submitted'
        }
    }

    return {
        Subject: 'Quote Request Submission',
        TopicArn: 'REDACTED', 
        location: 'https://contfire.com/pages/quote-request-submitted'
    }
}

exports.handler = async({ body }) => {
    const questions = body
        
        // split questions from other questions
        .split('&')
        
        // split question from answer
        .map(qa => qa.split('='))
        
        // reduce to on object
        .reduce((all, [q,a]) => {
            all[q] = a;
            return all;
        }, {})

    const prettyQuestions = Object.entries(questions)
        
        // remove the pretty labels
        .filter(([q, a]) => !q.startsWith('label-') && !q.startsWith('settings-'))
        
        // use the pretty labels
        .map(([q, a]) => [questions[`label-${q}`] || q, a])
        
        // handle + in urls
        .map(([q, a]) => [q && q.replace(/\+/g, '%20'), a && a.replace(/\+/g, '%20')])
        
        // getting overboard with maps
        .map(([q, a]) => [q && decodeURIComponent(q), a && decodeURIComponent(a)])
        
        // question then parsed answer
        .map(([q, a]) => `${q}\n${a}`);
        
    const { Subject, TopicArn, location } = getSettings(questions);

    const response = {
        statusCode: 303,
        body: 'Thank you.',
        headers: {
            location
        }
    };

    try {
        var sns = new AWS.SNS();
        var params = {
            Message: prettyQuestions.join('\n\n'),
            Subject,
            TopicArn,
        };

        await sns.publish(params).promise();
    }
    catch (err) {
        console.log(err)
    }

    return response;
};
